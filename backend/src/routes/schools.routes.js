// PROJO GROUP — Schools Hub Routes
const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

// ── PUBLIC: LIST SCHOOLS ──────────────────────────────────────
router.get("/", authenticate, async (req,res) => {
  try {
    const { search } = req.query;
    const where = { verified:true, active:true };
    if(search) where.name = { contains:search, mode:"insensitive" };
    const schools = await prisma.school.findMany({
      where,
      include: { _count:{ select:{ notices:true, followers:true, carpools:true } } },
      orderBy: { name:"asc" }
    });
    // Add follow status for current user
    const follows = await prisma.schoolFollow.findMany({ where:{ userId:req.user.id }, select:{ schoolId:true } });
    const followedIds = new Set(follows.map(f=>f.schoolId));
    res.json({ schools: schools.map(s=>({
      ...s, adminEmail:undefined, adminPassword:undefined, adminToken:undefined,
      noticeCount:s._count.notices, followerCount:s._count.followers, carpoolCount:s._count.carpools,
      following: followedIds.has(s.id)
    }))});
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── GET SINGLE SCHOOL ─────────────────────────────────────────
router.get("/:id", authenticate, async (req,res) => {
  try {
    const school = await prisma.school.findUnique({ where:{id:req.params.id}, include:{ _count:{ select:{ notices:true, followers:true } } } });
    if(!school) return res.status(404).json({error:"School not found"});
    const following = await prisma.schoolFollow.findFirst({ where:{ userId:req.user.id, schoolId:req.params.id } });
    res.json({ school:{ ...school, adminEmail:undefined, adminPassword:undefined, adminToken:undefined, following:!!following } });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── FOLLOW / UNFOLLOW ─────────────────────────────────────────
router.post("/:id/follow", authenticate, async (req,res) => {
  try {
    const existing = await prisma.schoolFollow.findFirst({ where:{ userId:req.user.id, schoolId:req.params.id } });
    if(existing) {
      await prisma.schoolFollow.delete({ where:{ id:existing.id } });
      res.json({ following:false });
    } else {
      await prisma.schoolFollow.create({ data:{ userId:req.user.id, schoolId:req.params.id } });
      res.json({ following:true });
    }
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── GET NOTICES FOR A SCHOOL ──────────────────────────────────
router.get("/:id/notices", authenticate, async (req,res) => {
  try {
    const { type } = req.query;
    const where = { schoolId:req.params.id };
    if(type && type!=="All") where.type = type;
    const notices = await prisma.schoolNotice.findMany({
      where, orderBy:[{pinned:"desc"},{createdAt:"desc"}], take:50
    });
    res.json({ notices });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── GET CARPOOLS FOR A SCHOOL ─────────────────────────────────
router.get("/:id/carpools", authenticate, async (req,res) => {
  try {
    const carpools = await prisma.schoolCarpool.findMany({
      where:{ schoolId:req.params.id, status:"ACTIVE" },
      orderBy:{ createdAt:"desc" }
    });
    res.json({ carpools });
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.post("/:id/carpools", authenticate, async (req,res) => {
  try {
    const carpool = await prisma.schoolCarpool.create({
      data:{ ...req.body, schoolId:req.params.id, postedById:req.user.id, seatsAvailable:parseInt(req.body.seatsAvailable)||3 }
    });
    res.json({ carpool });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── MY FOLLOWED SCHOOLS FEED ──────────────────────────────────
router.get("/feed/mine", authenticate, async (req,res) => {
  try {
    const follows = await prisma.schoolFollow.findMany({ where:{ userId:req.user.id }, select:{ schoolId:true } });
    const schoolIds = follows.map(f=>f.schoolId);
    const notices = await prisma.schoolNotice.findMany({
      where:{ schoolId:{ in:schoolIds } },
      include:{ school:{ select:{ name:true, type:true } } },
      orderBy:[{urgent:"desc"},{pinned:"desc"},{createdAt:"desc"}],
      take:30
    });
    res.json({ notices });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── SCHOOL ADMIN: LOGIN ───────────────────────────────────────
router.post("/admin/login", async (req,res) => {
  try {
    const { email, password } = req.body;
    const school = await prisma.school.findFirst({ where:{ adminEmail:email } });
    if(!school || !school.adminPassword) return res.status(401).json({error:"Invalid credentials"});
    const ok = await bcrypt.compare(password, school.adminPassword);
    if(!ok) return res.status(401).json({error:"Invalid credentials"});
    const token = jwt.sign({ schoolId:school.id, type:"SCHOOL_ADMIN" }, process.env.JWT_SECRET, { expiresIn:"30d" });
    await prisma.school.update({ where:{ id:school.id }, data:{ adminToken:token } });
    res.json({ token, school:{ id:school.id, name:school.name, verified:school.verified } });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── SCHOOL ADMIN: AUTH MIDDLEWARE ─────────────────────────────
function schoolAuth(req,res,next) {
  const token = req.headers.authorization?.replace("Bearer ","");
  if(!token) return res.status(401).json({error:"No token"});
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if(payload.type !== "SCHOOL_ADMIN") return res.status(403).json({error:"Not a school admin"});
    req.schoolId = payload.schoolId;
    next();
  } catch { res.status(401).json({error:"Invalid token"}); }
}

// ── SCHOOL ADMIN: GET OWN SCHOOL ──────────────────────────────
router.get("/admin/me", schoolAuth, async (req,res) => {
  try {
    const school = await prisma.school.findUnique({
      where:{ id:req.schoolId },
      include:{ _count:{ select:{ notices:true, followers:true } } }
    });
    res.json({ school:{ ...school, adminPassword:undefined, adminToken:undefined } });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── SCHOOL ADMIN: POST NOTICE ─────────────────────────────────
router.post("/admin/notices", schoolAuth, async (req,res) => {
  try {
    const school = await prisma.school.findUnique({ where:{ id:req.schoolId } });
    if(!school?.verified) return res.status(403).json({error:"School not verified yet"});
    const notice = await prisma.schoolNotice.create({
      data:{
        ...req.body, schoolId:req.schoolId,
        eventDate: req.body.eventDate ? new Date(req.body.eventDate) : null,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
      }
    });
    res.json({ notice });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── SCHOOL ADMIN: GET OWN NOTICES ────────────────────────────
router.get("/admin/notices", schoolAuth, async (req,res) => {
  try {
    const notices = await prisma.schoolNotice.findMany({
      where:{ schoolId:req.schoolId },
      orderBy:{ createdAt:"desc" }
    });
    res.json({ notices });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── SCHOOL ADMIN: UPDATE NOTICE ───────────────────────────────
router.put("/admin/notices/:id", schoolAuth, async (req,res) => {
  try {
    const notice = await prisma.schoolNotice.update({
      where:{ id:req.params.id, schoolId:req.schoolId },
      data:{ ...req.body, eventDate:req.body.eventDate?new Date(req.body.eventDate):undefined }
    });
    res.json({ notice });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── SCHOOL ADMIN: DELETE NOTICE ───────────────────────────────
router.delete("/admin/notices/:id", schoolAuth, async (req,res) => {
  try {
    await prisma.schoolNotice.delete({ where:{ id:req.params.id, schoolId:req.schoolId } });
    res.json({ success:true });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── PROJO ADMIN: REGISTER SCHOOL ─────────────────────────────
router.post("/register", async (req,res) => {
  try {
    const { name, type, address, suburb, phone, email, website, principalName, adminEmail, adminPassword } = req.body;
    if(!name||!address||!suburb||!adminEmail||!adminPassword) return res.status(400).json({error:"Missing required fields"});
    const hashed = await bcrypt.hash(adminPassword, 10);
    const school = await prisma.school.create({
      data:{ name, type:type||"Primary", address, suburb, phone, email, website, principalName, adminEmail, adminPassword:hashed, verified:false }
    });
    res.json({ school:{ id:school.id, name:school.name, verified:school.verified }, message:"Registration submitted — await PROJO verification." });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── PROJO ADMIN: VERIFY SCHOOL ────────────────────────────────
router.post("/admin-verify/:id", async (req,res) => {
  // This gets called from the PROJO admin panel
  const adminKey = req.headers["x-admin-key"];
  if(adminKey !== process.env.ADMIN_SECRET) return res.status(403).json({error:"Forbidden"});
  try {
    const school = await prisma.school.update({
      where:{ id:req.params.id },
      data:{ verified:true, verifiedAt:new Date() }
    });
    res.json({ school });
  } catch(e){ res.status(500).json({error:e.message}); }
});

module.exports = router;
