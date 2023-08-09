import { ApolloServer, gql } from "apollo-server";

// Type definitions (schema)
const typeDefs = gql`
    type Query {
        me: User!
        post: Post!
    } 
    
    type User {
        id: ID!
        name: String!
        email: String!
        age: Int
    }
    
    type Post {
        id: ID!
        title: String!
        body: String!
        published: Boolean!
    }
`

// Resolvers
const resolvers = {
    Query: {
        me() {
            return {
                
            }
        },

        post() {

        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers
})

server.listen().then(({ url }) => {
    console.log(`Server ready on ${url}`)
})
