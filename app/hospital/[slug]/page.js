import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const HOSPITAL_CATEGORIES = [
  { key: "safety", label: "Safety" },
  { key: "location", label: "Location" },
  { key: "happiness", label: "Happiness" },
  { key: "facilities", label: "Facilities" },
  { key: "internet", label: "Internet" },
  { key: "reputation", label: "Reputation" },
  { key: "respiratory", label: "Respiratory Dept." },
  { key: "social", label: "Social" },
  { key: "food", label: "Food" },
];
const UNIT_CATEGORIES = [
  { key: "ratios", label: "Staffing ratios" },
  { key: "management", label: "Management" },
  { key: "culture", label: "Culture" },
  { key: "pay", label: "Pay" },
];

function avg(reviews, key) {
  if (!reviews || !reviews.length) return 0;
  return reviews.reduce((s, r) => s + (Number(r[key]) || 0), 0) / reviews.length;
}
function overallAvg(reviews, categories) {
  if (!reviews || !reviews.length) return 0;
  const sum = reviews.reduce((s, r) => s + categories.reduce((cs, c) => cs + (Number(r[c.key]) || 0), 0) / categories.length, 0);
  return sum / reviews.length;
}
function scoreColor(score) {
  if (!score) return "#5B6B63";
  if (score >= 3.8) return "#0F5132";
  if (score >= 3.0) return "#7A5B00";
  return "#7A1313";
}
function scoreBg(score) {
  if (!score) return "#DDE3DC";
  if (score >= 3.8) return "#A9F0CE";
  if (score >= 3.0) return "#FCE985";
  return "#F8AFAF";
}

async function getHospital(slug) {
  const { data } = await supabase
    .from("hospitals")
    .select("*, units(*, unit_reviews(*)), hospital_reviews(*)")
    .eq("slug", slug)
    .single();
  return data;
}

export async function generateMetadata({ params }) {
  const hospital = await getHospital(params.slug);
  if (!hospital) return { title: "Hospital not found — Rate My Unit" };
  const score = overallAvg(hospital.hospital_reviews, HOSPITAL_CATEGORIES);
  const title = `${hospital.name} Reviews — Rate My Unit`;
  const description = `See staff ratings for ${hospital.name} in ${hospital.city}${score ? ` — ${score.toFixed(1)}/5 overall` : ""}. Real reports from people who worked there.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function HospitalPage({ params }) {
  const hospital = await getHospital(params.slug);

  if (!hospital) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, sans-serif" }}>
        <p>Hospital not found. <a href="/" style={{ color: "#3E8EDE" }}>Back to Rate My Unit</a></p>
      </div>
    );
  }

  const hReviews = hospital.hospital_reviews || [];
  const units = hospital.units || [];
  const overall = overallAvg(hReviews, HOSPITAL_CATEGORIES);

  return (
    <div style={{ background: "#EAF3FB", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 60px" }}>
        <a href="/" style={{ fontSize: 13, color: "#64809A", textDecoration: "none" }}>← Rate My Unit</a>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#16324A", margin: "12px 0 4px" }}>{hospital.name}</h1>
        <p style={{ fontSize: 14, color: "#64809A", margin: "0 0 20px" }}>{hospital.city}</p>

        <div style={{ background: "linear-gradient(135deg, #EAF3FB, #DCEBFA)", border: "1px solid #D7E6F3", borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#64809A", fontWeight: 700, marginBottom: 8 }}>
            Overall quality · {hReviews.length} report{hReviews.length === 1 ? "" : "s"}
          </div>
          <span style={{ display: "inline-block", background: scoreBg(overall), color: scoreColor(overall), fontWeight: 800, fontSize: 28, borderRadius: 12, padding: "8px 18px" }}>
            {overall ? overall.toFixed(1) : "—"}
          </span>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #D7E6F3", borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
          {HOSPITAL_CATEGORIES.map((c, i) => {
            const v = avg(hReviews, c.key);
            return (
              <div key={c.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: i === 0 ? "none" : "1px solid #EEF4FA" }}>
                <span style={{ fontSize: 14.5, color: "#16324A" }}>{c.label}</span>
                <span style={{ background: scoreBg(v), color: scoreColor(v), fontWeight: 800, fontSize: 13, borderRadius: 8, padding: "3px 10px" }}>{v ? v.toFixed(1) : "—"}</span>
              </div>
            );
          })}
        </div>

        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#16324A", marginBottom: 8 }}>Units at this hospital ({units.length})</h2>
        <div style={{ marginBottom: 24 }}>
          {units.map((u) => {
            const uScore = overallAvg(u.unit_reviews, UNIT_CATEGORIES);
            return (
              <a key={u.id} href={`/hospital/${hospital.slug}/unit/${u.slug}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", background: "#FFFFFF", border: "1px solid #D7E6F3", borderRadius: 14, padding: 14, marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#16324A", fontSize: 15 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: "#64809A" }}>{u.type} · Floor {u.floor} · {(u.unit_reviews || []).length} report{(u.unit_reviews || []).length === 1 ? "" : "s"}</div>
                </div>
                <span style={{ background: scoreBg(uScore), color: scoreColor(uScore), fontWeight: 800, fontSize: 15, borderRadius: 10, padding: "6px 12px" }}>{uScore ? uScore.toFixed(1) : "—"}</span>
              </a>
            );
          })}
          {units.length === 0 && <p style={{ fontSize: 13, color: "#64809A" }}>No units listed yet.</p>}
        </div>

        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#16324A", marginBottom: 8 }}>Reports ({hReviews.length})</h2>
        <div style={{ marginBottom: 28 }}>
          {[...hReviews].reverse().map((r) => (
            <div key={r.id} style={{ borderTop: "1px solid #D7E6F3", padding: "14px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: "#16324A", fontSize: 14 }}>{r.role}</span>
                <span style={{ fontSize: 12, color: "#64809A" }}>{(r.created_at || "").slice(0, 10)}</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "#33475A", margin: 0 }}>{r.comment}</p>
            </div>
          ))}
          {hReviews.length === 0 && <p style={{ fontSize: 13, color: "#64809A" }}>No reports yet for this hospital.</p>}
        </div>

        <a href="/" style={{ display: "block", textAlign: "center", background: "#0F9D6A", color: "#FFFFFF", fontWeight: 700, fontSize: 14, borderRadius: 12, padding: "14px", textDecoration: "none" }}>
          Sign in to post a report or browse more hospitals →
        </a>
      </div>
    </div>
  );
}
