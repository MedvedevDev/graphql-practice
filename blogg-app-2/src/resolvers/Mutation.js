import {v4 as uuidv4} from "uuid";
import { PubSub } from "graphql-subscriptions";
const pubsub = new PubSub();

const Mutation = {
    async createUser(parent, args, { prisma }, info) {
        const emailTaken = await prisma.user.findUnique({
            where: {
                email: args.data.email
            }
        })

        if (!emailTaken) {
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

    async updateUser(parent, { id, data }, { prisma }, info) {
        const user = await prisma.user.findUnique({
            where: {
                id: id
            }
        })

        if (!user) {
            throw new Error("User not found");
        }

        // Update email
        if (typeof data.email === 'string') {
            // Check if email is already taken by another user
            const emailTaken = await prisma.user.findUnique({
                where: {
                    email: data.email
                }
            })

            if (emailTaken) {
                throw new Error("Email taken");
            }

            await prisma.user.update({
                where: { id: id },
                data: { email: data.email },
            })
        }

        // Update name
        if (typeof data.name === 'string') {
            await prisma.user.update({
                where: { id: id },
                data: { name: data.name },
            })
        }

        // Update age
        if (typeof data.age !== 'undefined') {
            await prisma.user.update({
                where: { id: id },
                data: { age: data.age },
            })
        }

        return user;
    },

    async deleteUser(parent, args, { prisma }, info) {
        const user = await prisma.user.findUnique({
            where: {
                id: args.id
            }
        })

        if (!user) {
            throw new Error("User not found");
        }

        // Delete user by splice method (returns array of deleted elements)
        await prisma.user.delete({
            where: {
                id: args.id
            }
        })

        // Delete all associated posts
        await prisma.post.deleteMany({
            where: {
                authorId: args.id
            }
        })

        // Delete comments in the post
        await prisma.comment.deleteMany({
            where: {
                authorId: args.id
            }
        })

        return user;
    },

    async createPost(parent, args, { pubsub, prisma }, info) {
        const user = await prisma.user.findUnique({
            where: {
                id: args.data.authorId
            }
        })

        if (!user) {
            throw new Error("User not found");
        }

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

    async updatePost(parent, { id, data }, { pubsub, prisma }, info) {
        const post = await prisma.post.findUnique({
            where: {
                id: id
            }
        })

        const originalPost = { ...post };

        if (!post) {
            throw new Error("Post not found");
        }

        // Update title
        if (typeof data.title === 'string') {
            await prisma.post.update({
                where: { id: id },
                data: { title: data.title },
            })
        }

        // Update body
        if (typeof data.body === 'string') {
            await prisma.post.update({
                where: { id: id },
                data: { body: data.body },
            })
        }

        // Update status
        if (typeof data.published === 'boolean') {
            await prisma.post.update({
                where: { id: id },
                data: { published: data.published },
            })

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

    async deletePost(parent, args, { prisma, pubsub }, info) {
        const post = await prisma.post.findUnique({
            where: {
                id: args.id
            }
        })

        if (!post) {
            throw new Error('Post not found')
        }

        // Delete comments belonging to the post
        await prisma.comment.deleteMany({
            where: {
                postId: args.id
            }
        })

        // Delete the post
        await prisma.post.delete({
            where: {
                id: args.id
            }
        })

        return post;
    },

    async createComment(parent, args, { pubsub, prisma }, info) {
        const userExists = await prisma.user.findUnique({
            where: {
                id: args.data.authorId
            }
        })
        const postExists = await prisma.post.findUnique({
            where: {
                id: args.data.postId,
                published: true
            }
        })

        if (!userExists || !postExists) {
            throw new Error('User not found or post is not published')
        }

        // Update comment if user exists and post is published
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

    async updateComment(parent, { id, data }, { prisma }, info) {
        const comment = await prisma.comment.findUnique({
            where: {
                id: id
            }
        })

        if (!comment) {
            throw new Error("Comment not found");
        }

        if (typeof data.text === 'string') {
            await prisma.comment.update({
                where: { id: id },
                data: { text: data.text },
            })
        }

        // Sub
        // pubsub.publish(`COMMENT ${comment.post}`, {
        //     comment: {
        //         mutation: 'UPDATED',
        //         data: comment
        //     }
        // })

        return comment;
    },

    deleteComment(parent, args, { prisma }, info) {
        const comment = prisma.comment.findUnique({
            where: {
                id: args.id
            }
        });

        if (!comment) {
            throw new Error('Comment not found');
        }

        // Delete particular comment
        prisma.comment.delete({
            where: {
                id: args.id
            }
        });

        // Subscription
        // pubsub.publish(`COMMENT ${removed[0].post}`, {
        //     comment: {
        //         mutation: 'DELETED',
        //         data: removed[0]
        //     }
        // })

        return comment;
    }
}

export { Mutation as default }