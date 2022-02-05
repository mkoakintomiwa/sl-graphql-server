#import requests
import pip._vendor.requests as requests
import json
from datetime import timedelta, date

def make_query(query, variables, url, headers={'content-type': 'application/json'}):
    """
    Make Query Response
    """
    request = requests.post(url, json=dict({'query': query, 'variables': variables}), headers=headers)
    if request.status_code == 200:
        return request.json()
    else:
        raise Exception("Query failed to run with code {}. {}".format(request.status_code, request.text))


# Create Users
createUsersMutation = """
mutation CreateUsers($input: [UserCreateInput!]!) {
  createUsers(input: $input) {
    users {
      id
      name
      email
      description
    }
    info {
      nodesCreated
    }
  }
}
"""


# Create Brands
createBrandsMutation = """
mutation CreateBrands($input: [BrandCreateInput!]!) {
  createBrands(input: $input) {
    brands {
      id
      name
    },
    info {
      nodesCreated
    }
  }
}
"""

# Create Posts w/ conversations
createPostsMutation = """
mutation CreatePosts($input: [PostCreateInput!]!) {
  createPosts(input: $input) {
    info {
      nodesCreated
    }
  }
}
"""

# Create Perks w/ conversations
createPerksMutation = """
mutation CreatePerks($input: [PerkCreateInput!]!) {
  createPerks(input: $input) {
    info {
      nodesCreated
    }
  }
}
"""

# Create Causes w/ conversations
createCausesMutation = """
mutation CreateCauses($input: [CauseCreateInput!]!) {
  createCauses(input: $input) {
    info {
      nodesCreated
    }
  }
}
"""



##############################
# SEQUENCE                   #
# 0. Load dummy data         #
# 1. Parse causes            #
# 2. Create brands           #
# 3. Create users            #
# 4. Create posts w/ convos  #
# 5. Create perks w/ convos  #
##############################

# Basic Setup - GQL URL + Data Load
url = "http://localhost/graphql" #"https://sl-gql-server.herokuapp.com/graphql"
data = json.load(open('./data_updated.json'))

def addAllCauses(brandsData, usersData):
  causes = []
  for b in brandsData:
    if 'causes' in b.keys():
      for c in b['causes']:
        if c not in causes:
          causes.append(c)
  for u in usersData:
    if 'causes' in u.keys():
      for c in u['causes']:
        if c not in causes:
          causes.append(c)
  input = {"input": [{"title": c} for c in causes]}
  print(make_query(createCausesMutation, input, url))

addAllCauses(data['brandsData'], data['usersData'])

# Parse causes
def addCausesInputToData(data):
  causes = []
  if 'causes' in data.keys():
    if len(data['causes']) > 0:
      for c in data['causes']:
        causes.append(
          {
            "where": {"node": {"title": c}},
            "onCreate": {"node": {"title": c}}
          })
      data['causes'] = {"connectOrCreate": causes}
    else:
      data.pop('causes')
  return data


# Create Brands
def createBrandsInput(brandsData):
  for b in brandsData:
    b = addCausesInputToData(b)
  return {'input': brandsData}

brandsInput = createBrandsInput(data['brandsData'])
print(make_query(createBrandsMutation, brandsInput, url))

# Create Users
def createUsersInput(usersData):
  for u in usersData:
    u = addCausesInputToData(u)
    # Check if employee
    if 'employeeData' in u:
      # is employee
      brand = u['employeeData']['brand']
      edgeData = u['employeeData']
      edgeData.pop('brand')
      u.pop('employeeData')

      u['employeeOfBrands'] = {
        "connect": [{
          "where": {"node":{"name": brand}},
          "edge": edgeData
        }]
      }

      if brand in u['brands']:
        u['brands'].remove(brand)
      
    # After processing employee data, connect to brands
    if len(u['brands']) > 0:
      memberData = []
      for b in u['brands']:
        memberData.append({
          "where": {"node": {"name": b}},
          "edge": {"tier": "VIP"}
        })
      u['memberOfBrands'] = {"connect": memberData}
    u.pop('brands')
  
  return {'input': usersData}

usersInput = createUsersInput(data['usersData'])
print(make_query(createUsersMutation, usersInput, url))

# Parse Comments and Replies
def createReplyInput(replyData):
  replyData["createdBy"] = {"connect": {"where": {"node": {"email": replyData['creator']}}}}
  replyData.pop("creator")
  return {"node": replyData}

def createCommentInput(commentData):
  commentData["createdBy"] = {"connect": {"where": {"node": {"email": commentData['creator']}}}}
  commentData.pop("creator")
  if "replies" in commentData.keys():
    commentData['replies'] = {"create": [createReplyInput(r) for r in commentData['replies']]}
  return {"node": commentData}


# Create posts w/ convos
def createPostsInput(postsData, conversationsData):
  for p in postsData:
    #brand
    p["inBrandCommunity"] = {"connect": {"where": {"node": {"name": p['brand']}}}}
    p.pop('brand')
    #creator
    p["createdBy"] = {"connect": {"where": {"node": {"email": p['creator']}}}}
    p.pop('creator')
    if "conversationIndex" in p.keys():
      if p["conversationIndex"] < len(conversationsData):
        p["comments"] = {"create": [createCommentInput(c) for c in conversationsData[p["conversationIndex"]]]}
      p.pop("conversationIndex")

  return {"input": postsData}

postsInput = createPostsInput(data['postsData'], data['conversationsData'])
print(make_query(createPostsMutation, postsInput, url))

# Create perks w/ convos
def createPerksInput(perksData, conversationsData):
  for p in perksData:
    #brand
    p["inBrandCommunity"] = {"connect": {"where": {"node": {"name": p['brand']}}}}
    p.pop('brand')
    #creator
    p["createdBy"] = {"connect": {"where": {"node": {"email": p['creator']}}}}
    p.pop('creator')
    p["startDate"] = (date.today() + timedelta(days=p["startDate"])).isoformat()
    p["endDate"] = (date.today() + timedelta(days=p["endDate"])).isoformat()
    if "conversationIndex" in p.keys():
      if p["conversationIndex"] < len(conversationsData):
        p["comments"] = {"create": [createCommentInput(c) for c in conversationsData[p["conversationIndex"]]]}
      p.pop("conversationIndex")

  return {"input": perksData}

postsInput = createPerksInput(data['perksData'], data['conversationsData'])
print(make_query(createPerksMutation, postsInput, url))