import {startApolloServer} from "./graphql";

var apolloServer =  null;

const init = async () => {
    apolloServer = await startApolloServer();
}

init();