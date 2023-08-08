// @ts-ignore
import { Context } from "../index";
import { Post } from "@prisma/client";

interface PostCreateArgs {
    title: string
    content: string
}

interface PostPayloadType {
    userErrors: {
        message: string
    }[],
    post: Post | null
}

export const Mutation = {
        postCreate: async (parent: any, args: PostCreateArgs, context: Context): Promise<PostPayloadType> => {
            const { prisma } = context;
            const { title, content } = args;

            if (!title || !content) {
                return {
                    userErrors: [
                        { message: "Provide title and content!" }
                    ],
                    post: null
                }
            }

            const post = await prisma.post.create({
                data: {
                    title,
                    content,
                    userId: 1
                }
            })

            return {
                userErrors: [],
                post
            }
        }
    }