import { ApolloServer, gql } from "apollo-server";
import { v4 as uuidv4 } from 'uuid';

const users = [{
        id: 1,
        name: "String",
        email:"String",
        age: 12
},
    {
        id: 2,
        name: "String",
        email:"String",
        age: 11
    },
    {
        id: 3,
        name: "String 3",
        email:"String 3",
        age: 10
    }
]

const comments = [
    {
        id: 1,
        comment: "string string",
        author: 1,
        post: 1
    },
    {
        id: 2,
        comment: "string string",
        author: 2,
        post: 1
    },
    {
        id: 3,
        comment: "string string",
        author: 2,
        post: 2
    },
    {
        id: 4,
        comment: "string string",
        author: 3,
        post: 3
    }
]

const posts = [{
    id: 1,
    title: "2",
    body: "strng",
    published: false,
    author: '1'
},
    {
        id: 2,
        title: "strng 2",
        body: "strng 2",
        published: true,
        author: '1'
    },
    {
        id: 3,
        title: "2",
        body: "strng",
        published: true,
        author: '2'
    }
]

// Type definitions (schema)
const typeDefs = gql`
    type Query {
        add(a: Float!, b: Float!): Float!
        me: User!
        post: Post!
        users: [User!]!
        posts(query: String): [Post!]!
        comments: [Comment!]!
    } 
    
    type User {
        id: ID!
        name: String!
        email: String!
        age: Int
        posts: [Post]!
        comments: [Comment]!
    }
    
    type Post {
        id: ID!
        title: String!
        body: String!
        published: Boolean!
        author: User!
        comments: [Comment]!
    }
    
    type Comment {
        id: ID!
        comment: String!
        author: User!
        post: Post!
    }
    
    type Mutation {
        createUser(name: String!, email: String!, age: Int!): User!
    }
`

// Resolvers
const resolvers = {
    Query: {
        users(parent, {query}, context, info) {
            return users;
        },

        posts(parent, {query}, context, info) {
            if (!query) {
                return posts;
            }

            return posts.filter(post => post.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
        },

        comments() {
            return comments;
        },
    },

    Mutation: {
        createUser(parent, args, context, info) {
            const emailTaken = users.some(user => user.email === args.email.toLowerCase().trim())

            if (emailTaken) {
                throw new Error('Email taken');
            }

            const user = {
                id: uuidv4(),
                name: args.name,
                email: args.email,
                age: args.age
            }
            users.push(user);
            return user;
        }
    },

    Post: {
        author(parent, args, context, info) {
            return users.find(user => user.id === Number(parent.author));
        },

        comments(parent, args, context, info) {
            return comments.filter(comment => comment.post === parent.id);
        }
    },

    User: {
        posts(parent, args, context, info) {
            return posts.filter(post => Number(post.author) === parent.id);
        },

        comments(parent, args, context, info) {
            return comments.filter(comment => Number(comment.author) === parent.id);
        }
    },

    Comment: {
        author(parent, args, context, info) {
            return users.find(user => user.id === Number(parent.author));
        },

        post(parent, args, context, info) {
            return posts.find(post => post.id === parent.post);
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
