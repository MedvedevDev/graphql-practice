import {v4 as uuidv4} from "uuid";
import { PubSub } from "graphql-subscriptions";
const pubsub = new PubSub();

const Mutation = {
    async createUser(parent, args, { prisma }, info) {
        const emailTaken = db.users.some((user) => user.email === args.data.email)

        if (emailTaken) {
            throw new Error('Email taken')
        }

        const user = await prisma.user.create({
            data: {
                id: uuidv4(),
                // name: args.name,
                // email: args.email,
                // age: args.age
                ...args.data
            }
        });

        await pubsub.publish('COUNTED', { counted: user });

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

    async createPost(parent, args, { pubsub, prisma }, info) {
        //const userExists = db.users.some((user) => user.id === args.data.author)

        // if (!userExists) {
        //     throw new Error('User not found')
        // }

        const post = await prisma.post.create({
            data: {
                id: uuidv4(),
                ...args.data
            }
        });

        //Add subscription only if post was created with published: true
        if (args.data.published) {
            pubsub.publish('POST', {
                post: {
                    mutation: 'CREATED',
                    data: post
                }
            })
        }

        return post;
    },

    updatePost(parent, { id, data }, { db, pubsub }, info) {
        const post = db.posts.find(post => post.id === id);
        const originalPost = { ...post };

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

            if (originalPost.published && !post.published)  {
                // deleted
                pubsub.publish('POST', {
                    post: {
                        mutation: 'DELETED',
                        data: originalPost
                    }
                })
            } else if(!originalPost.published && post.published) {
                // created
                pubsub.publish('POST', {
                    post: {
                        mutation: 'CREATED',
                        data: post
                    }
                })
            }
        } else if(post.published) {
            // updated
            pubsub.publish('POST', {
                post: {
                    mutation: 'UPDATED',
                    data: post
                }
            })
        }

        return post;
    },

    deletePost(parent, args, { db, pubsub }, info) {
        const postIndex = db.posts.findIndex(post => post.id === args.id);

        if (postIndex === -1) {
            throw new Error('Post not found')
        }

        // Delete comments belonging to the post
        db.comments = db.comments.filter(cmnt => cmnt.post !== args.id);

        // Delete the post
        const deletedPosts = db.posts.splice(postIndex, 1);

        //Add subscription
        if (deletedPosts[0].published) {
            pubsub.publish('POST', {
                post: {
                    mutation: 'DELETED',
                    data: deletedPosts[0]
                }
            })
        }

        return deletedPosts[0];
    },

    async createComment(parent, args, { pubsub, prisma }, info) {
        const userExists = db.users.some((user) => user.id === args.data.author)
        const postExists = db.posts.some(post => post.id === args.data.post && post.published)

        if (!userExists || !postExists) {
            throw new Error('User or post not found')
        }

        const comment = await prisma.comment.create({
            data: {
                id: uuidv4(),
                ...args.data
            }
        });

        // Subscription
        pubsub.publish(`COMMENT ${args.data.post}`, {
            comment: {
                mutation: 'CREATED',
                data: comment
            } })

        return comment;
    },

    updateComment(parent, { id, data }, { db, pubsub }, info) {
        const comment = db.comments.find(cmnt => cmnt.id === id);

        if (!comment) {
            throw new Error("Comment not found");
        }

        if (typeof data.text === 'string') {
            comment.text = data.text;
        }

        // Sub
        pubsub.publish(`COMMENT ${comment.post}`, {
            comment: {
                mutation: 'UPDATED',
                data: comment
            }
        })

        return comment;
    },

    deleteComment(parent, args, { db, pubsub }, info) {
        const commentIndex = db.comments.findIndex(cmnt => cmnt.id === args.id);

        if (commentIndex === -1) {
            throw new Error('Comment not found');
        }

        // Delete particular comment
        const removed = db.comments.splice(commentIndex, 1);

        // Subscription
        pubsub.publish(`COMMENT ${removed[0].post}`, {
            comment: {
                mutation: 'DELETED',
                data: removed[0]
            }
        })

        return removed[0];
    }
}

export { Mutation as default }