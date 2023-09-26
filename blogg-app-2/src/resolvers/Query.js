const Query = {
    async users(parent, args, { prisma }, info) {
        if (!args.query) {
            return await prisma.user.findMany({
                orderBy: {
                        email: "asc"
                    }
            });
        }

        return await prisma.user.findMany({
            where: {
                name: args.query.toLowerCase()
            }
        })
    },

    async posts(parent, args, { prisma }, info) {
        if (!args.query) {
            return await prisma.post.findMany({});
        }

        return await prisma.post.findMany({
            where: {
                title: args.query.toLowerCase()
            }
        });
    },

    async comments(parent, args, { prisma }, info) {
        return await prisma.comment.findMany({});
    }
}

export { Query as default }