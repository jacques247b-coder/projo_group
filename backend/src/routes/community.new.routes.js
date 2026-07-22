// PROJO GROUP — Community Routes (Giveaway, Noticeboard, Donations, Carpool)
const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── GIVEAWAY ──────────────────────────────────────────────────
router.get("/giveaway", authenticate, async (req,res) => {
  try {
    const items = await prisma.giveawayItem.findMany({ where:{status:"AVAILABLE"}, orderBy:{createdAt:"desc"}, include:{postedBy:{select:{name:true}}} });
    res.json({ items });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.get("/giveaway/mine", authenticate, async (req,res) => {
  try {
    const items = await prisma.giveawayItem.findMany({ where:{postedById:req.user.id}, orderBy:{createdAt:"desc"} });
    res.json({ items });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/giveaway", authenticate, async (req,res) => {
  try {
    const item = await prisma.giveawayItem.create({ data:{...req.body, postedById:req.user.id, status:"AVAILABLE"} });
    res.json({ item });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.put("/giveaway/:id/claim", authenticate, async (req,res) => {
  try {
    const item = await prisma.giveawayItem.update({ where:{id:req.params.id,postedById:req.user.id}, data:{status:"CLAIMED",claimedById:req.user.id,claimedAt:new Date()} });
    res.json({ item });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.delete("/giveaway/:id", authenticate, async (req,res) => {
  try { await prisma.giveawayItem.delete({where:{id:req.params.id,postedById:req.user.id}}); res.json({success:true}); }
  catch(e){ res.status(500).json({error:e.message}); }
});

// ── NOTICEBOARD ───────────────────────────────────────────────
router.get("/noticeboard", authenticate, async (req,res) => {
  try {
    const { category } = req.query;
    const where = { status:"ACTIVE" };
    if(category) where.category = category;
    const posts = await prisma.noticeboardPost.findMany({ where, orderBy:[{urgent:"desc"},{createdAt:"desc"}], include:{_count:{select:{comments:true,upvotes:true}},postedBy:{select:{name:true}}} });
    res.json({ posts: posts.map(p=>({...p,commentCount:p._count.comments,upvotes:p._count.upvotes})) });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/noticeboard", authenticate, async (req,res) => {
  try {
    const post = await prisma.noticeboardPost.create({ data:{...req.body, postedById:req.user.id, status:"ACTIVE", expiresAt:new Date(Date.now()+30*24*60*60*1000)} });
    res.json({ post });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/noticeboard/:id/upvote", authenticate, async (req,res) => {
  try {
    const existing = await prisma.noticeboardUpvote.findFirst({ where:{postId:req.params.id,userId:req.user.id} });
    if(!existing) await prisma.noticeboardUpvote.create({ data:{postId:req.params.id,userId:req.user.id} });
    res.json({ success:true });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/noticeboard/:id/comments", authenticate, async (req,res) => {
  try {
    const comment = await prisma.noticeboardComment.create({ data:{postId:req.params.id,userId:req.user.id,body:req.body.body} });
    res.json({ comment:{...comment,userName:req.user.name} });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── DONATIONS ─────────────────────────────────────────────────
router.get("/donations", authenticate, async (req,res) => {
  try {
    const needs = await prisma.donationNeed.findMany({ where:{status:"ACTIVE"}, orderBy:[{urgent:"desc"},{createdAt:"desc"}], include:{charity:{select:{name:true,location:true}}} });
    res.json({ needs });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/donations/:id/pledge", authenticate, async (req,res) => {
  try {
    const pledge = await prisma.donationPledge.create({ data:{needId:req.params.id,pledgedById:req.user.id,...req.body,quantity:req.body.quantity?parseInt(req.body.quantity):null} });
    if(req.body.quantity){
      const need = await prisma.donationNeed.findUnique({where:{id:req.params.id}});
      await prisma.donationNeed.update({where:{id:req.params.id},data:{fulfilledQuantity:(need.fulfilledQuantity||0)+parseInt(req.body.quantity)}});
    }
    res.json({ pledge });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── CARPOOL ───────────────────────────────────────────────────
router.get("/carpool", authenticate, async (req,res) => {
  try {
    const routes = await prisma.carpoolRoute.findMany({ where:{status:"ACTIVE"}, orderBy:{createdAt:"desc"}, include:{postedBy:{select:{name:true}}} });
    res.json({ routes });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/carpool", authenticate, async (req,res) => {
  try {
    const route = await prisma.carpoolRoute.create({ data:{...req.body, postedById:req.user.id, seatsAvailable:parseInt(req.body.seatsAvailable)||3, status:"ACTIVE"} });
    res.json({ route });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/carpool/:id/interest", authenticate, async (req,res) => {
  try {
    const interest = await prisma.carpoolInterest.create({ data:{routeId:req.params.id,userId:req.user.id,...req.body} });
    res.json({ interest });
  } catch(e){ res.status(500).json({error:e.message}); }
});

module.exports = router;
