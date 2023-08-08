import { ApolloServer } from "apollo-server";
// @ts-ignore
import { typeDefs } from "./schema";
// @ts-ignore
import { Query, Mutation } from "./resolvers/index";
import { PrismaClient, Prisma } from "@prisma/client"
import { DefaultArgs } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

// define type of the context
export interface Context {
    prisma: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>
}

const server = new ApolloServer({
    typeDefs,
    resolvers: {
        Query,
        Mutation
    },
    context: {
        prisma
    }
})

server.listen().then(({ url }) => {
    console.log(`Server ready on ${url}`)
})