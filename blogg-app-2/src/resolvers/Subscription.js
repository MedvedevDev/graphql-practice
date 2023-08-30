const Subscription = {
    //Create comment sub
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

    // Create post sub
    post: {
        subscribe: (parent,  args, { pubsub }, info) => {
            return pubsub.asyncIterator('POST_CREATED');
        }
    }
}

export { Subscription as default }