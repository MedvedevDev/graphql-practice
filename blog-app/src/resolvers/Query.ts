// @ts-ignore
import {Context} from "../index";

export const Query = {
        posts: async (parent: any, args: any, context: Context) => {
            const { prisma } = context;
            const posts = await prisma.post.findMany({
                orderBy: [{ createdAt: "desc" }]
            });
            return posts;
        }
    }