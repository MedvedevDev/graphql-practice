const  User = {
    async posts(parent, args, { prisma }, info) {
        return await prisma.post.findMany({
            where: {
                authorId: parent.id
            }
        })
},
    async comments(parent, args, { prisma }, info) {
        return await prisma.comment.findMany({
            where: {
                authorId: parent.id
            }
        })
    }
}

export { User as default }