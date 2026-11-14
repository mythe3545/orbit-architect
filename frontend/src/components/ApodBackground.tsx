import { useApod } from "@/lib/hooks";

export const FALLBACK_BG = "https://images-assets.nasa.gov/image/carina_nebula/carina_nebula~medium.jpg";

/** NASA Astronomy Picture of the Day as a soft, transparent full-screen backdrop. */
export default function ApodBackground() {
  const { data } = useApod();
  const url = data?.url || FALLBACK_BG;
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden data-testid="apod-background">
      <img key={url} src={url} alt="" className="absolute inset-0 size-full object-cover opacity-[0.42] scale-105 blur-[0.5px] transition-opacity duration-1000" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(7,11,18,0.2),rgba(7,11,18,0.72))]" />
    </div>
  );
}

export function ApodCredit() {
  const { data } = useApod();
  return (
    <span className="truncate" data-testid="apod-credit">
      {data?.url ? `APOD ${data.date} · ${data.title}${data.copyright ? ` © ${data.copyright}` : ""}` : "NASA/ESA/CSA Webb · Carina Nebula"}
    </span>
  );
}
