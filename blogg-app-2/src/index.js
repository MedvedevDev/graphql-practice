import { ApolloServer, gql } from "apollo-server";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import Query from "./resolvers/Query.js";
import Mutation from "./resolvers/Mutation.js";
import User from "./resolvers/User.js";
import Post from "./resolvers/Post.js";
import Comment from "./resolvers/Comment.js";

// Read the schema file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaFilePath = path.join(__dirname, 'schema.graphql');
const schema = fs.readFileSync(schemaFilePath, 'utf-8');

// Resolvers
const resolvers = {
    Query,
    Mutation,
    User,
    Post,
    Comment
}

const server = new ApolloServer({
    typeDefs: schema,
    resolvers,
    context: {
        db
    }
})

server.listen().then(({ url }) => {
    console.log(`Server ready on ${url}`)
})
