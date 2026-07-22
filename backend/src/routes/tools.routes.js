// PROJO GROUP — Personal Tools Routes
const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── NOTES ─────────────────────────────────────────────────────
router.get("/notes", authenticate, async (req,res) => {
  try {
    const notes = await prisma.note.findMany({ where:{userId:req.user.id,archived:false}, orderBy:[{pinned:"desc"},{updatedAt:"desc"}] });
    res.json({ notes });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/notes", authenticate, async (req,res) => {
  try {
    const note = await prisma.note.create({ data:{...req.body, userId:req.user.id} });
    res.json({ note });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.put("/notes/:id", authenticate, async (req,res) => {
  try {
    const note = await prisma.note.update({ where:{id:req.params.id,userId:req.user.id}, data:req.body });
    res.json({ note });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.delete("/notes/:id", authenticate, async (req,res) => {
  try {
    await prisma.note.delete({ where:{id:req.params.id,userId:req.user.id} });
    res.json({ success:true });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── TASKS ─────────────────────────────────────────────────────
router.get("/tasks", authenticate, async (req,res) => {
  try {
    const tasks = await prisma.task.findMany({ where:{userId:req.user.id}, orderBy:{createdAt:"desc"} });
    res.json({ tasks });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/tasks", authenticate, async (req,res) => {
  try {
    const task = await prisma.task.create({ data:{...req.body, userId:req.user.id, dueDate:req.body.dueDate?new Date(req.body.dueDate):null} });
    res.json({ task });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.put("/tasks/:id", authenticate, async (req,res) => {
  try {
    const task = await prisma.task.update({ where:{id:req.params.id,userId:req.user.id}, data:req.body });
    res.json({ task });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.delete("/tasks/:id", authenticate, async (req,res) => {
  try {
    await prisma.task.delete({ where:{id:req.params.id,userId:req.user.id} });
    res.json({ success:true });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── JOURNAL ───────────────────────────────────────────────────
router.get("/journal", authenticate, async (req,res) => {
  try {
    const entries = await prisma.journalEntry.findMany({ where:{userId:req.user.id}, orderBy:{createdAt:"desc"} });
    res.json({ entries });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/journal", authenticate, async (req,res) => {
  try {
    const entry = await prisma.journalEntry.create({ data:{...req.body, userId:req.user.id} });
    res.json({ entry });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.put("/journal/:id", authenticate, async (req,res) => {
  try {
    const entry = await prisma.journalEntry.update({ where:{id:req.params.id,userId:req.user.id}, data:req.body });
    res.json({ entry });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.delete("/journal/:id", authenticate, async (req,res) => {
  try {
    await prisma.journalEntry.delete({ where:{id:req.params.id,userId:req.user.id} });
    res.json({ success:true });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── GOALS ─────────────────────────────────────────────────────
router.get("/goals", authenticate, async (req,res) => {
  try {
    const goals = await prisma.goal.findMany({ where:{userId:req.user.id}, orderBy:{createdAt:"desc"} });
    res.json({ goals });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/goals", authenticate, async (req,res) => {
  try {
    const goal = await prisma.goal.create({ data:{...req.body, userId:req.user.id, targetDate:req.body.targetDate?new Date(req.body.targetDate):null, progress:parseInt(req.body.progress)||0} });
    res.json({ goal });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.put("/goals/:id", authenticate, async (req,res) => {
  try {
    const goal = await prisma.goal.update({ where:{id:req.params.id,userId:req.user.id}, data:req.body });
    res.json({ goal });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.delete("/goals/:id", authenticate, async (req,res) => {
  try {
    await prisma.goal.delete({ where:{id:req.params.id,userId:req.user.id} });
    res.json({ success:true });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── HABITS ────────────────────────────────────────────────────
router.get("/habits", authenticate, async (req,res) => {
  try {
    const habits = await prisma.habit.findMany({ where:{userId:req.user.id}, include:{logs:{orderBy:{date:"desc"},take:30}}, orderBy:{createdAt:"desc"} });
    // Calculate streak for each
    const withStreak = habits.map(h => {
      let streak=0; const today=new Date(); today.setHours(0,0,0,0);
      for(let i=0;i<365;i++){
        const d=new Date(today); d.setDate(d.getDate()-i);
        const dateStr=d.toISOString().split("T")[0];
        if(h.logs.some(l=>l.date===dateStr)) streak++; else break;
      }
      return {...h, currentStreak:streak};
    });
    res.json({ habits:withStreak });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/habits", authenticate, async (req,res) => {
  try {
    const habit = await prisma.habit.create({ data:{...req.body, userId:req.user.id, targetDays:parseInt(req.body.targetDays)||21} });
    res.json({ habit });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/habits/:id/log", authenticate, async (req,res) => {
  try {
    const date = req.body.date || new Date().toISOString().split("T")[0];
    const existing = await prisma.habitLog.findFirst({ where:{habitId:req.params.id,userId:req.user.id,date} });
    if(existing) return res.status(409).json({error:"Already logged today"});
    const log = await prisma.habitLog.create({ data:{habitId:req.params.id,userId:req.user.id,date} });
    res.json({ log });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.delete("/habits/:id", authenticate, async (req,res) => {
  try {
    await prisma.habit.delete({ where:{id:req.params.id,userId:req.user.id} });
    res.json({ success:true });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── FINANCE ───────────────────────────────────────────────────
router.get("/finance/expenses", authenticate, async (req,res) => {
  try {
    const expenses = await prisma.expense.findMany({ where:{userId:req.user.id}, orderBy:{createdAt:"desc"} });
    res.json({ expenses });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/finance/expenses", authenticate, async (req,res) => {
  try {
    const expense = await prisma.expense.create({ data:{...req.body, userId:req.user.id, amount:parseFloat(req.body.amount), date:req.body.date?new Date(req.body.date):new Date()} });
    res.json({ expense });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.delete("/finance/expenses/:id", authenticate, async (req,res) => {
  try { await prisma.expense.delete({where:{id:req.params.id,userId:req.user.id}}); res.json({success:true}); }
  catch(e){ res.status(500).json({error:e.message}); }
});
router.get("/finance/income", authenticate, async (req,res) => {
  try {
    const income = await prisma.income.findMany({ where:{userId:req.user.id}, orderBy:{createdAt:"desc"} });
    res.json({ income });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/finance/income", authenticate, async (req,res) => {
  try {
    const income = await prisma.income.create({ data:{...req.body, userId:req.user.id, amount:parseFloat(req.body.amount), date:req.body.date?new Date(req.body.date):new Date()} });
    res.json({ income });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.delete("/finance/income/:id", authenticate, async (req,res) => {
  try { await prisma.income.delete({where:{id:req.params.id,userId:req.user.id}}); res.json({success:true}); }
  catch(e){ res.status(500).json({error:e.message}); }
});

// ── SHOPPING ──────────────────────────────────────────────────
router.get("/shopping/lists", authenticate, async (req,res) => {
  try {
    const lists = await prisma.shoppingList.findMany({ where:{userId:req.user.id}, include:{_count:{select:{items:true}}}, orderBy:{updatedAt:"desc"} });
    res.json({ lists: lists.map(l=>({...l,itemCount:l._count.items})) });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/shopping/lists", authenticate, async (req,res) => {
  try {
    const list = await prisma.shoppingList.create({ data:{name:req.body.name, userId:req.user.id} });
    res.json({ list });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.delete("/shopping/lists/:id", authenticate, async (req,res) => {
  try { await prisma.shoppingList.delete({where:{id:req.params.id,userId:req.user.id}}); res.json({success:true}); }
  catch(e){ res.status(500).json({error:e.message}); }
});
router.get("/shopping/lists/:id/items", authenticate, async (req,res) => {
  try {
    const items = await prisma.shoppingItem.findMany({ where:{listId:req.params.id}, orderBy:{createdAt:"asc"} });
    res.json({ items });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/shopping/lists/:id/items", authenticate, async (req,res) => {
  try {
    const item = await prisma.shoppingItem.create({ data:{name:req.body.name, quantity:req.body.quantity||1, listId:req.params.id, userId:req.user.id} });
    res.json({ item });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.put("/shopping/items/:id", authenticate, async (req,res) => {
  try {
    const item = await prisma.shoppingItem.update({ where:{id:req.params.id}, data:req.body });
    res.json({ item });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.delete("/shopping/items/:id", authenticate, async (req,res) => {
  try { await prisma.shoppingItem.delete({where:{id:req.params.id}}); res.json({success:true}); }
  catch(e){ res.status(500).json({error:e.message}); }
});

// ── HEALTH ────────────────────────────────────────────────────
router.get("/health/logs", authenticate, async (req,res) => {
  try {
    const logs = await prisma.healthLog.findMany({ where:{userId:req.user.id}, orderBy:{createdAt:"desc"} });
    res.json({ logs });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/health/logs", authenticate, async (req,res) => {
  try {
    const log = await prisma.healthLog.create({ data:{...req.body, userId:req.user.id, weight:req.body.weight?parseFloat(req.body.weight):null, sleepHours:req.body.sleepHours?parseFloat(req.body.sleepHours):null, waterGlasses:req.body.waterGlasses?parseInt(req.body.waterGlasses):null, date:req.body.date?new Date(req.body.date):new Date()} });
    res.json({ log });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.get("/health/medications", authenticate, async (req,res) => {
  try {
    const medications = await prisma.medication.findMany({ where:{userId:req.user.id}, orderBy:{createdAt:"desc"} });
    res.json({ medications });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/health/medications", authenticate, async (req,res) => {
  try {
    const medication = await prisma.medication.create({ data:{...req.body, userId:req.user.id} });
    res.json({ medication });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.delete("/health/medications/:id", authenticate, async (req,res) => {
  try { await prisma.medication.delete({where:{id:req.params.id,userId:req.user.id}}); res.json({success:true}); }
  catch(e){ res.status(500).json({error:e.message}); }
});

// ── FITNESS ───────────────────────────────────────────────────
router.get("/fitness/workouts", authenticate, async (req,res) => {
  try {
    const workouts = await prisma.workout.findMany({ where:{userId:req.user.id}, orderBy:{createdAt:"desc"} });
    res.json({ workouts });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/fitness/workouts", authenticate, async (req,res) => {
  try {
    const workout = await prisma.workout.create({ data:{...req.body, userId:req.user.id, date:req.body.date?new Date(req.body.date):new Date(), distance:req.body.distance?parseFloat(req.body.distance):null, calories:req.body.calories?parseInt(req.body.calories):null} });
    res.json({ workout });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── PLACES ────────────────────────────────────────────────────
router.get("/places", authenticate, async (req,res) => {
  try {
    const places = await prisma.savedPlace.findMany({ where:{userId:req.user.id}, orderBy:{createdAt:"desc"} });
    res.json({ places });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/places", authenticate, async (req,res) => {
  try {
    const place = await prisma.savedPlace.create({ data:{...req.body, userId:req.user.id, rating:req.body.rating?parseInt(req.body.rating):5} });
    res.json({ place });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.delete("/places/:id", authenticate, async (req,res) => {
  try { await prisma.savedPlace.delete({where:{id:req.params.id,userId:req.user.id}}); res.json({success:true}); }
  catch(e){ res.status(500).json({error:e.message}); }
});

// ── CALENDAR ──────────────────────────────────────────────────
router.get("/calendar", authenticate, async (req,res) => {
  try {
    const { month, year } = req.query;
    let where = { userId:req.user.id };
    if(month && year){
      const start=new Date(parseInt(year),parseInt(month)-1,1);
      const end=new Date(parseInt(year),parseInt(month),0,23,59,59);
      where.date = { gte:start, lte:end };
    }
    const events = await prisma.calendarEvent.findMany({ where, orderBy:{date:"asc"} });
    res.json({ events });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.post("/calendar", authenticate, async (req,res) => {
  try {
    const event = await prisma.calendarEvent.create({ data:{...req.body, userId:req.user.id, date:new Date(req.body.date)} });
    res.json({ event });
  } catch(e){ res.status(500).json({error:e.message}); }
});
router.delete("/calendar/:id", authenticate, async (req,res) => {
  try { await prisma.calendarEvent.delete({where:{id:req.params.id,userId:req.user.id}}); res.json({success:true}); }
  catch(e){ res.status(500).json({error:e.message}); }
});

module.exports = router;
