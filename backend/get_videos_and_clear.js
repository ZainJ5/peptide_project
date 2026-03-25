process.env.NODE_ENV = 'development';
require('dotenv').config();
const { Video, CommunityPost, PostUpvote } = require('./src/models');

async function run() {
  try {
    const videos = await Video.findAll({ raw: true });
    console.log(JSON.stringify(videos, null, 2));
    
    await PostUpvote.destroy({ where: {} });
    await CommunityPost.destroy({ where: {} });
    console.log("CLEARED_COMMUNITY_POSTS");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
