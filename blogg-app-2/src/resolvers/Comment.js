const Comment = {
    async author(parent, args, { prisma }, info) {
        return await prisma.user.findUnique({
            where: {
                id: parent.authorId
            }
        })
    },

    async post(parent, args, { prisma }, info) {
        return await prisma.post.findUnique({
            where: {
                id: parent.postId
            }
        })
    }
}

export { Comment as default }