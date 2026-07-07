// PROJO DATING — Profile Setup / Edit
// Handles both first-time onboarding (no profile yet) and later edits.
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { datingAPI } from "../../services/api";

const GENDERS = ["Man", "Woman", "Non-binary"];
const INTERESTED_IN_OPTIONS = ["Men", "Women", "Everyone"];
const GOALS = ["Serious Relationship", "Marriage", "Long-Term", "Casual", "Friendship", "Dating"];
const SUGGESTED_INTERESTS = ["Hiking", "Braai", "Travel", "Music", "Yoga", "Cooking", "Gym", "Soccer",
  "Reading", "Dancing", "Art", "Movies", "Gaming", "Photography", "Wine", "Fitness", "Nature", "Jazz"];

export default function ProfileSetup({ C, FD, FB, existingProfile, onSaved, onCancel }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    age: existingProfile?.age || "",
    gender: existingProfile?.gender || "Woman",
    interestedIn: existingProfile?.interestedIn || ["Everyone"],
    bio: existingProfile?.bio || "",
    city: existingProfile?.city || "Rustenburg",
    relationshipGoals: existingProfile?.relationshipGoals || [],
    interests: existingProfile?.interests || [],
  });
  const [customInterest, setCustomInterest] = useState("");
  const [photos, setPhotos] = useState(existingProfile?.photos || []);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // The profile row doesn't exist in the database until the first successful
  // Save — photo upload needs a real profile to attach to, so it stays
  // locked (with a clear reason) until that first save has happened.
  const [profileExists, setProfileExists] = useState(!!existingProfile);

  function toggleInArray(field, value) {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value) ? f[field].filter((v) => v !== value) : [...f[field], value],
    }));
  }

  function addInterest(value) {
    const v = value.trim();
    if (!v || form.interests.includes(v)) return;
    setForm((f) => ({ ...f, interests: [...f.interests, v] }));
    setCustomInterest("");
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!profileExists) { toast.error("Save your profile details first, then add photos"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Photos must be under 2MB"); return; }
    if (photos.length >= 6) { toast.error("Maximum 6 photos"); return; }
    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await datingAPI.addPhoto(reader.result);
        setPhotos(res.profile.photos);
        toast.success("Photo added");
      } catch (err) {
        toast.error(err.error || "Couldn't upload photo");
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function removePhoto(index) {
    try {
      const res = await datingAPI.removePhoto(index);
      setPhotos(res.profile.photos);
    } catch (err) {
      toast.error("Couldn't remove photo");
    }
  }

  async function handleSave() {
    if (!form.age || form.age < 18) { toast.error("You must be 18 or older"); return; }
    if (!form.bio.trim()) { toast.error("Add a short bio so people know who you are"); return; }
    if (form.relationshipGoals.length === 0) { toast.error("Pick at least one relationship goal"); return; }
    setSaving(true);
    try {
      await datingAPI.upsertProfile({ ...form, age: parseInt(form.age, 10) });
      setProfileExists(true);
      if (existingProfile) {
        toast.success("Profile saved");
        onSaved?.();
      } else {
        toast.success("Profile created! Add some photos, then you're ready to go 💕");
      }
    } catch (err) {
      console.error("[ProfileSetup] Save failed — full error:", err);
      toast.error(err.error || "Couldn't save profile — please try again", { duration: Infinity });
    } finally {
      setSaving(false);
    }
  }

  const label = { fontSize: "12px", fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", display: "block" };
  const input = { width: "100%", padding: "12px 14px", borderRadius: "12px", background: C.cardLight, border: `1px solid ${C.border}`, color: C.text, fontSize: "14px", outline: "none", fontFamily: FB };
  const chip = (active) => ({
    padding: "7px 14px", borderRadius: "999px", fontSize: "12.5px", cursor: "pointer",
    border: `1px solid ${active ? C.rose : C.border}`,
    background: active ? `linear-gradient(135deg, ${C.crimson}, ${C.rose})` : "transparent",
    color: active ? "#fff" : C.textMuted, fontWeight: active ? "700" : "400",
  });

  return (
    <div style={{ minHeight: "100vh", background: C.midnight, color: C.text, fontFamily: FB, padding: "1.5rem 1rem 6rem" }}>
      <div style={{ maxWidth: "500px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
          <button
            onClick={() => (onCancel ? onCancel() : navigate("/"))}
            aria-label="Back"
            style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, borderRadius: "10px", width: "36px", height: "36px", color: C.text, fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >←</button>
          <div>
            <div style={{ fontFamily: FD, fontSize: "28px", fontWeight: "700", background: `linear-gradient(135deg, ${C.rose}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {existingProfile ? "Edit Your Profile" : "Create Your Dating Profile"}
            </div>
            <div style={{ fontSize: "13px", color: C.textMuted }}>
              {existingProfile ? "Keep it fresh — update anytime." : "This is what other members will see. Be genuine."}
            </div>
          </div>
        </div>

        {/* Photos */}
        <label style={label}>Photos ({photos.length}/6){!profileExists && " — save your details below first"}</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "1.25rem" }}>
          {photos.map((url, i) => (
            <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: "12px", overflow: "hidden", border: `1px solid ${C.border}` }}>
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={() => removePhoto(i)} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: "22px", height: "22px", color: "#fff", fontSize: "12px", cursor: "pointer" }}>✕</button>
            </div>
          ))}
          {photos.length < 6 && (
            <label style={{ aspectRatio: "1", borderRadius: "12px", border: `1.5px dashed ${profileExists ? C.border : C.textDim}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: profileExists ? "pointer" : "not-allowed", flexDirection: "column", gap: "4px", opacity: profileExists ? 1 : 0.5 }}>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} disabled={uploadingPhoto || !profileExists} />
              <span style={{ fontSize: "22px" }}>{uploadingPhoto ? "…" : "+"}</span>
              <span style={{ fontSize: "10px", color: C.textDim }}>{profileExists ? "Add photo" : "Save first"}</span>
            </label>
          )}
        </div>

        <label style={label}>Age</label>
        <input type="number" min="18" max="99" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} style={{ ...input, marginBottom: "1.1rem" }} placeholder="Your age" />

        <label style={label}>I am</label>
        <div style={{ display: "flex", gap: "8px", marginBottom: "1.1rem", flexWrap: "wrap" }}>
          {GENDERS.map((g) => (
            <div key={g} onClick={() => setForm((f) => ({ ...f, gender: g }))} style={chip(form.gender === g)}>{g}</div>
          ))}
        </div>

        <label style={label}>Interested in</label>
        <div style={{ display: "flex", gap: "8px", marginBottom: "1.1rem", flexWrap: "wrap" }}>
          {INTERESTED_IN_OPTIONS.map((g) => (
            <div key={g} onClick={() => toggleInArray("interestedIn", g)} style={chip(form.interestedIn.includes(g))}>{g}</div>
          ))}
        </div>

        <label style={label}>City / Town</label>
        <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} style={{ ...input, marginBottom: "1.1rem" }} placeholder="e.g. Rustenburg" />

        <label style={label}>Bio</label>
        <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={4} maxLength={400} style={{ ...input, marginBottom: "1.1rem", resize: "vertical", fontFamily: FB }} placeholder="Tell people a bit about yourself…" />

        <label style={label}>Looking for</label>
        <div style={{ display: "flex", gap: "8px", marginBottom: "1.1rem", flexWrap: "wrap" }}>
          {GOALS.map((g) => (
            <div key={g} onClick={() => toggleInArray("relationshipGoals", g)} style={chip(form.relationshipGoals.includes(g))}>{g}</div>
          ))}
        </div>

        <label style={label}>Interests</label>
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
          {SUGGESTED_INTERESTS.map((g) => (
            <div key={g} onClick={() => toggleInArray("interests", g)} style={chip(form.interests.includes(g))}>{g}</div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
          <input value={customInterest} onChange={(e) => setCustomInterest(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addInterest(customInterest)} placeholder="Add your own…" style={input} />
          <button onClick={() => addInterest(customInterest)} style={{ background: C.cardLight, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "0 16px", color: C.text, cursor: "pointer" }}>Add</button>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {existingProfile && onCancel && (
            <button onClick={onCancel} style={{ flex: 1, padding: "14px", borderRadius: "14px", background: "none", border: `1px solid ${C.border}`, color: C.textMuted, fontSize: "14px", cursor: "pointer" }}>Cancel</button>
          )}
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "14px", borderRadius: "14px", background: `linear-gradient(135deg, ${C.crimson}, ${C.rose})`, border: "none", color: "#fff", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>
            {saving ? "Saving…" : existingProfile ? "Save Changes" : profileExists ? "Save Details" : "Create Profile"}
          </button>
        </div>

        {!existingProfile && profileExists && (
          <button onClick={() => onSaved?.()} style={{ width: "100%", marginTop: "10px", padding: "14px", borderRadius: "14px", background: `linear-gradient(135deg, ${C.gold}, #9A7A10)`, border: "none", color: C.dark, fontWeight: "800", fontSize: "14px", cursor: "pointer" }}>
            Start Discovering 💕
          </button>
        )}
      </div>
    </div>
  );
}
