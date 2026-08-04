import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

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

async function getUnit(hospitalSlug, unitSlug) {
  const { data: hospital } = await supabase
    .from("hospitals")
    .select("id, name, city, slug")
    .eq("slug", hospitalSlug)
    .single();
  if (!hospital) return null;
  const { data: unit } = await supabase
    .from("units")
    .select("*, unit_reviews(*)")
    .eq("hospital_id", hospital.id)
    .eq("slug", unitSlug)
    .single();
  if (!unit) return null;
  return { ...unit, hospitals: hospital };
}

export async function generateMetadata({ params }) {
  const unit = await getUnit(params.slug, params.unitSlug);
  if (!unit) return { title: "Unit not found — Rate My Unit" };
  const score = overallAvg(unit.unit_reviews, UNIT_CATEGORIES);
  const title = `${unit.name} at ${unit.hospitals?.name} — Rate My Unit`;
  const description = `Staffing ratios, management, culture, and pay for ${unit.name}${score ? ` — ${score.toFixed(1)}/5 overall` : ""}. Real reports from people who worked there.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function UnitPage({ params }) {
  const unit = await getUnit(params.slug, params.unitSlug);

  if (!unit) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, sans-serif" }}>
        <p>Unit not found. <a href="/" style={{ color: "#3E8EDE" }}>Back to Rate My Unit</a></p>
      </div>
    );
  }

  const reviews = unit.unit_reviews || [];
  const overall = overallAvg(reviews, UNIT_CATEGORIES);
  const hospital = unit.hospitals;

  return (
    <div style={{ background: "#EAF3FB", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 60px" }}>
        <a href={`/hospital/${hospital?.slug}`} style={{ fontSize: 13, color: "#64809A", textDecoration: "none" }}>← {hospital?.name}</a>

        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#3E8EDE", fontWeight: 700, margin: "12px 0 4px" }}>
          Floor {unit.floor} · {unit.type}
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#16324A", margin: "0 0 4px" }}>{unit.name}</h1>
        <p style={{ fontSize: 14, color: "#64809A", margin: "0 0 20px" }}>{hospital?.name} · {hospital?.city}</p>

        <div style={{ background: "linear-gradient(135deg, #EAF3FB, #DCEBFA)", border: "1px solid #D7E6F3", borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#64809A", fontWeight: 700, marginBottom: 8 }}>
            Overall quality · {reviews.length} report{reviews.length === 1 ? "" : "s"}
          </div>
          <span style={{ display: "inline-block", background: scoreBg(overall), color: scoreColor(overall), fontWeight: 800, fontSize: 28, borderRadius: 12, padding: "8px 18px" }}>
            {overall ? overall.toFixed(1) : "—"}
          </span>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #D7E6F3", borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
          {UNIT_CATEGORIES.map((c, i) => {
            const v = avg(reviews, c.key);
            return (
              <div key={c.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: i === 0 ? "none" : "1px solid #EEF4FA" }}>
                <span style={{ fontSize: 14.5, color: "#16324A" }}>{c.label}</span>
                <span style={{ background: scoreBg(v), color: scoreColor(v), fontWeight: 800, fontSize: 13, borderRadius: 8, padding: "3px 10px" }}>{v ? v.toFixed(1) : "—"}</span>
              </div>
            );
          })}
        </div>

        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#16324A", marginBottom: 8 }}>Reports ({reviews.length})</h2>
        <div style={{ marginBottom: 28 }}>
          {[...reviews].reverse().map((r) => (
            <div key={r.id} style={{ borderTop: "1px solid #D7E6F3", padding: "14px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: "#16324A", fontSize: 14 }}>{r.role}</span>
                <span style={{ fontSize: 12, color: "#64809A" }}>{(r.created_at || "").slice(0, 10)}</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "#33475A", margin: 0 }}>{r.comment}</p>
            </div>
          ))}
          {reviews.length === 0 && <p style={{ fontSize: 13, color: "#64809A" }}>No reports yet for this unit.</p>}
        </div>

        <a href="/" style={{ display: "block", textAlign: "center", background: "#0F9D6A", color: "#FFFFFF", fontWeight: 700, fontSize: 14, borderRadius: 12, padding: "14px", textDecoration: "none" }}>
          Sign in to post a report or browse more hospitals →
        </a>
      </div>
    </div>
  );
}
