import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import cors from 'cors';
import bodyParser from 'body-parser';
import express from 'express';
import http from 'http';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import Subscription from "./resolvers/Subscription.js";
import Query from "./resolvers/Query.js";
import Mutation from "./resolvers/Mutation.js";
import User from "./resolvers/User.js";
import Post from "./resolvers/Post.js";
import Comment from "./resolvers/Comment.js";
import {PubSub} from "graphql-subscriptions";

// Read the schema file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaFilePath = path.join(__dirname, 'schema.graphql');
const typeDefs = fs.readFileSync(schemaFilePath, 'utf-8');

// Resolvers
const resolvers = {
    Query,
    Mutation,
    User,
    Post,
    Comment,
    Subscription
}


// Create the schema, which will be used separately by ApolloServer and
// the WebSocket server.
const schema = makeExecutableSchema({ typeDefs, resolvers });

const pubsub = new PubSub();

// Create an Express app and HTTP server to attach both the WebSocket
// server and the ApolloServer to this HTTP server.
const app = express();
const httpServer = http.createServer(app);

// Create  WebSocket server using the HTTP server
const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
});

// Save the returned server's info so we can shutdown this server later; Pass the context to subscription resolvers
const serverCleanup = useServer({
    schema,
    context: (ctx, msg, args) => {
        return {
            pubsub,
            db
        };
    }
}, wsServer);

// Set up ApolloServer.
const server = new ApolloServer({
    schema,
    context: ({ req }) => ({
        db,
        pubsub
    }),
    plugins: [
        // Proper shutdown for the HTTP server.
        ApolloServerPluginDrainHttpServer({ httpServer }),

        // Proper shutdown for the WebSocket server.
        {
            async serverWillStart() {
                return {
                    async drainServer() {
                        await serverCleanup.dispose();
                    },
                };
            },
        },
    ]
});

await server.start();

app.use(
    '/graphql',
    cors(),
    bodyParser.json(),
    expressMiddleware(server, {
        context: ({ req }) => ({
            db,
            pubsub
        }),
    })
);

const PORT = 4000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Query endpoint ready at http://localhost:${PORT}/graphql`);
    console.log(`🚀 Subscription endpoint ready at ws://localhost:${PORT}/graphql`);
});