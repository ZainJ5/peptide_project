require('dotenv').config();
const { CommunityPost, PostUpvote } = require('./src/models');

async function purgeAllPosts() {
  try {
    await PostUpvote.destroy({ where: {} });
    console.log("Deleted all post upvotes.");
    const count = await CommunityPost.destroy({ where: {} });
    console.log(`Successfully deleted ${count} community posts.`);
  } catch (e) {
    console.error("Error deleting posts:", e);
  } finally {
    process.exit(0);
  }
}

purgeAllPosts();
