import { ApolloServer } from "apollo-server";
// @ts-ignore
import { typeDefs } from "./schema";
// @ts-ignore
import { Query } from "./resolvers/index";

const server = new ApolloServer({
    typeDefs,
    resolvers: {
        Query
    }
})

server.listen().then(({ url }) => {
    console.log(`Server ready on ${url}`)
})