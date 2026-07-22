// PROJO GROUP — Civic Routes (Road Hazards, Utility Tracker, Municipalities)
const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── ROAD HAZARDS ──────────────────────────────────────────────
router.get("/road-hazards", authenticate, async (req,res) => {
  try {
    const reports = await prisma.roadHazardReport.findMany({ where:{status:"ACTIVE"}, orderBy:[{severity:"desc"},{createdAt:"desc"}], take:100 });
    res.json({ reports });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/road-hazards", authenticate, async (req,res) => {
  try {
    const report = await prisma.roadHazardReport.create({ data:{...req.body,reportedById:req.user.id,status:"ACTIVE",confirmations:0} });
    res.json({ report });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/road-hazards/:id/confirm", authenticate, async (req,res) => {
  try {
    const existing = await prisma.roadHazardConfirmation.findFirst({ where:{reportId:req.params.id,userId:req.user.id} });
    if(existing) return res.status(409).json({error:"Already confirmed"});
    await prisma.roadHazardConfirmation.create({ data:{reportId:req.params.id,userId:req.user.id} });
    const report = await prisma.roadHazardReport.update({ where:{id:req.params.id}, data:{confirmations:{increment:1}} });
    res.json({ report });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── UTILITY TRACKER ───────────────────────────────────────────
router.get("/utility-tracker", authenticate, async (req,res) => {
  try {
    const reports = await prisma.outageReport.findMany({ where:{}, orderBy:{createdAt:"desc"}, take:100 });
    res.json({ reports });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/utility-tracker", authenticate, async (req,res) => {
  try {
    const report = await prisma.outageReport.create({ data:{...req.body,reportedById:req.user.id,status:"ACTIVE",stillOutCount:0} });
    res.json({ report });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/utility-tracker/:id/still-out", authenticate, async (req,res) => {
  try {
    const existing = await prisma.stillOutConfirmation.findFirst({ where:{outageId:req.params.id,userId:req.user.id} });
    if(existing) return res.status(409).json({error:"Already confirmed"});
    await prisma.stillOutConfirmation.create({ data:{outageId:req.params.id,userId:req.user.id} });
    const report = await prisma.outageReport.update({ where:{id:req.params.id}, data:{stillOutCount:{increment:1}} });
    res.json({ report });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── MUNICIPALITIES ────────────────────────────────────────────
router.get("/municipalities", async (req,res) => {
  try {
    const municipalities = await prisma.municipality.findMany({ where:{verified:true}, orderBy:{name:"asc"} });
    res.json({ municipalities });
  } catch(e){ res.status(500).json({error:e.message}); }
});

module.exports = router;
