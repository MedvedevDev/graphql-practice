const Subscription = {
    comment: {
        subscribe: (parent, { postID }, { pubsub, db }, info) => {
            // Find post
            const post = db.posts.find(post => post.id === postID && post.published);
            if (!post) {
                throw new Error('Post not found');
            }

            // Subscribe
            return pubsub.asyncIterator(`COMMENT ${postID}`);
        }
    },


}

export { Subscription as default }