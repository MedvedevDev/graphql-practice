import {v4 as uuidv4} from "uuid";
import { PubSub } from "graphql-subscriptions";
const pubsub = new PubSub();

const Mutation = {
    async createUser(parent, args, { db }, info) {
        const emailTaken = db.users.some((user) => user.email === args.data.email)

        if (emailTaken) {
            throw new Error('Email taken')
        }

        const user = {
            id: uuidv4(),
            // name: args.name,
            // email: args.email,
            // age: args.age
            ...args.data
        }

        db.users.push(user);
        await pubsub.publish(COUNTED, { counted: user });

        return user;
    },

    updateUser(parent, { id, data }, { db }, info) {
        const user = db.users.find(user => user.id === id);

        if (!user) {
            throw new Error("User not found");
        }

        // Update email
        if (typeof data.email === 'string') {
            // Check if email is already taken by another user
            const emailTaken = db.users.some(user => user.email === data.email);

            if (emailTaken) {
                throw new Error("Email taken");
            }

            user.email = data.email;
        }

        // Update name
        if (typeof data.name === 'string') {
            user.name = data.name;
        }

        // Update age
        if (typeof data.age !== 'undefined') {
            user.age = data.age;
        }

        return user;
    },

    deleteUser(parent, args, { db }, info) {
        const userIndex = db.users.findIndex(user => user.id === args.id)

        if (userIndex === -1) {
            throw new Error('User not found')
        }

        // Delete user by splice method (returns array of deleted elements)
        const removed = db.users.splice(userIndex, 1);

        // Delete all associated posts
        db.posts = db.posts.filter(post => {
            const match = post.author === args.id;

            if (match) {
                // Delete comments in the post
                db.comments = db.comments.filter(comment => comment.post !== post.id);
            }

            return !match;
        })

        // Delete all associated comments
        db.comments = db.comments.filter(comment => comment.author !== args.id);

        return removed[0];
    },

    createPost(parent, args, { db }, info) {
        const userExists = db.users.some((user) => user.id === args.data.author)

        if (!userExists) {
            throw new Error('User not found')
        }

        const post = {
            id: uuidv4(),
            ...args.data
        }

        db.posts.push(post)

        return post
    },

    updatePost(parent, { id, data }, { db }, info) {
        const post = db.posts.find(post => post.id === id);

        if (!post) {
            throw new Error("Post not found");
        }

        if (typeof data.title === 'string') {
            post.title = data.title;
        }

        if (typeof data.body === 'string') {
            post.body = data.body;
        }

        if (typeof data.published === 'boolean') {
            post.published = data.published;
        }

        return post;
    },

    deletePost(parent, args, { db }, info) {
        const postIndex = db.posts.findIndex(post => post.id === args.id);

        if (postIndex === -1) {
            throw new Error('Post not found')
        }

        // Delete comments belonging to the post
        db.comments = db.comments.filter(cmnt => cmnt.post !== args.id);

        // Delete the post
        const deletedPosts = db.posts.splice(postIndex, 1);

        return deletedPosts[0];
    },

    createComment(parent, args, { db, pubsub }, info) {
        const userExists = db.users.some((user) => user.id === args.data.author)
        const postExists = db.posts.some(post => post.id === args.data.post && post.published)

        if (!userExists || !postExists) {
            throw new Error('User or post not found')
        }

        const comment = {
            id: uuidv4(),
            ...args.data
        };

        db.comments.push(comment);
        pubsub.publish(`COMMENT ${args.data.post}`, { comment }) // Subscription

        return comment;
    },

    updateComment(parent, { id, data }, { db }, info) {
        const comment = db.comments.find(cmnt => cmnt.id === id);

        if (!comment) {
            throw new Error("Comment not found");
        }

        if (typeof data.text === 'string') {
            comment.text = data.text;
        }

        return comment;
    },

    deleteComment(parent, args, { db }, info) {
        const commentIndex = db.comments.findIndex(cmnt => cmnt.id === args.id);

        if (commentIndex === -1) {
            throw new Error('Comment not found');
        }

        // Delete particular comment
        const removed = db.comments.splice(commentIndex, 1);

        return removed[0];
    }
}

export { Mutation as default }