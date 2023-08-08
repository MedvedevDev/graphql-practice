// @ts-ignore
import { Context } from "../index";
import {Post, Prisma} from "@prisma/client";

interface PostArgs {
    post: {
        title?: string
        content?: string
    }
}

interface PostPayloadType {
    userErrors: {
        message: string
    }[],
    post: Post | null | Prisma.Prisma__PostClient<Post>
}

export const Mutation = {
        postCreate: async (parent: any, { post }: PostArgs, context: Context): Promise<PostPayloadType> => {
            const { prisma } = context;
            const { title, content } = post;

            if (!title || !content) {
                return {
                    userErrors: [
                        { message: "Provide title or content!" }
                    ],
                    post: null
                }
            }

            return {
                userErrors: [],
                post: prisma.post.create({
                    data: {
                        title,
                        content,
                        userId: 1
                    }
                })
            }
        },

    postUpdate: async (parent: any, { post, postId }: {postId: string, post: PostArgs["post"]}, context: Context): Promise<PostPayloadType> => {
        const { title, content } = post;
        const { prisma } = context;

        if(!title && !content) {
            return {
                userErrors: [
                    { message: "Provide title or content!" }
                ],
                post: null
            }
        }

        const existingPost = await prisma.post.findUnique({
            where: {
                id: Number(postId)
            }
        })

        if(!existingPost) {
            return {
                userErrors: [
                    { message: "Post does not exist!" }
                ],
                post: null
            }
        }

        let payloadToUpdate = {
            title,
            content
        }

        if (!title)  delete payloadToUpdate.title;
        if (!content)  delete payloadToUpdate.content;

        return {
            userErrors: [],
            post: prisma.post.update({
                data: {
                    ...payloadToUpdate
                },
                where: {
                    id: Number(postId)
                }
            })
        }
    },

    postDelete:  async (parent: any, { postId }: { postId: string }, context: Context): Promise<PostPayloadType> => {
        const { prisma } = context;
        const post = await prisma.post.findUnique({
            where: {
                id: Number(postId)
            }
        })

        if(!post) {
            return {
                userErrors: [
                    { message: "Post does not exist!" }
                ],
                post: null
            }
        }

        await prisma.post.delete({
            where: {
                id: Number(postId)
            }
        })

        return {
            userErrors: [],
            post
        }
    }
}