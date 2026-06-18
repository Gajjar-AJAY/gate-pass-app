import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import './App.css';

/* ─── Loader ─── */
const Loader = () => (
  <div className="gp-loader-page">
    <div className="gp-spinner">
      <div className="gp-spinner__ring" />
      <div className="gp-spinner__ring gp-spinner__ring--inner" />
      <div className="gp-spinner__core" />
    </div>
    <p className="gp-loader-text">Fetching your gate pass…</p>
  </div>
);

/* ─── Info Row ─── */
const InfoRow = ({ label, value, highlight }) => (
  <div className="gp-info-row">
    <span className="gp-info-row__label">{label}</span>
    <span className={`gp-info-row__value${highlight ? " gp-info-row__value--bold" : ""}`}>
      {value || "—"}
    </span>
  </div>
);

/* ─── QR Modal ─── */
const QRModal = ({ image, passNumber, onClose }) => {
  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="gp-modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label="QR Code enlarged view">
      <div className="gp-modal">
        <div className="gp-modal__header">
          <span className="gp-modal__title">QR Code</span>
          <button className="gp-modal__close" onClick={onClose} aria-label="Close QR modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="gp-modal__body">
          {image
            ? <img src={image} alt="Gate Pass QR Code" className="gp-modal__qr-img" />
            : <div className="gp-modal__qr-empty">QR unavailable</div>
          }
        </div>
        <div className="gp-modal__footer">
          <span className="gp-modal__passno">{passNumber}</span>
          <p className="gp-modal__hint">Scan this code at entry</p>
        </div>
      </div>
    </div>
  );
};

/* ─── App ─── */
function App() {
  const navigate = useNavigate();
  const { id } = useParams();
  const printRef = useRef(null);

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchGatePass = async () => {
      setLoading(true);
      setError(null);
      try {
        const FLOW_URL = "https://3a4a0b9c59c1e756abf25c9cfbecaa.14.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/50f018caf3ac428fb4936c377de5027d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=jbbfLwecNYBBhmRWn4-ZMZP2sriK2TuaCMGNv2Dva6k";
        const res = await fetch(FLOW_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataid: id }),
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const record = await res.json();
        console.log("Flow Data", record);

        setData({
          passNumber:        record.gatePassNo         || "—",
          visitorName:       record.visitorName        || "—",
          mobileNumber:      record.visitorMobileNo    || "—",
          companyName:       record.visitorCompanyName || "—",
          hostEmployeeName:  record.hostPersonName     || "—",
          hostEmployeeEmail: record.hostPersonEmail    || "—",
          purposeOfVisit:    record.purposeOfVisit     || "—",
          numberOfVisitors:  record.NoOfVisitor        ?? 1,
          qrCodeImage:       record.gatePassQR
                               ? `data:image/png;base64,${record.gatePassQR}`
                               : null,
          visitorImg :       "data:image/jpeg;base64," + record.visitorImg,
          curretnStatus:     record.curretnStatus || "-"
        });
      } catch (err) {
        setError("Could not load visitor record. Please check the link and try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchGatePass();
  }, [id]);

  if (loading) return <Loader />;

  if (error) return (
    <div className="gp-empty-page">
      <div className="gp-empty-icon">⚠️</div>
      <h2 className="gp-empty-title">Something went wrong</h2>
      <p className="gp-empty-sub">{error}</p>
    </div>
  );

  if (!id && !data) return (
    <div className="gp-empty-page">
      <div className="gp-empty-icon">🪪</div>
      <h2 className="gp-empty-title">No gate pass found</h2>
      <p className="gp-empty-sub">Please generate a gate pass from the visitor form.</p>
    </div>
  );

  if (!data) return null;

  return (
    <div className="gp-page">
      <div className="gp-pass" ref={printRef}>

        {/* ── Decorative top strip ── */}
        <div className="gp-strip">
          <div className="gp-strip__left">
            <span className="gp-strip__eyebrow">VisitorHub</span>
            <span className="gp-strip__divider" />
            <span className="gp-strip__eyebrow">Visitor Gate Pass</span>
          </div>
          <button className="gp-print-btn no-print" onClick={() => window.print()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print Pass
          </button>
        </div>

        {/* ── Hero header ── */}
        <div className="gp-hero">
          <div className="gp-hero__blob gp-hero__blob--1" />
          <div className="gp-hero__blob gp-hero__blob--2" />

          <div className="gp-hero__content">
            <div className="gp-hero__left">
              <div className="gp-hero__avatar">
                <img src={data.visitorImg} alt="visitor_img"/>
              </div>
              <div>
                <h1 className="gp-hero__name">{data.visitorName}</h1>
                <p className="gp-hero__company">{data.companyName}</p>
              </div>
            </div>
            <div className="gp-hero__right">
              <p className="gp-hero__pass-label">PASS NUMBER</p>
              <p className="gp-hero__pass-number">{data.passNumber}</p>
              <span className="gp-hero__badge">
                <span className="gp-hero__badge-dot" />
                {data.curretnStatus}
              </span>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="gp-body">

          {/* QR panel */}
          <div className="gp-qr-panel">
            <p className="gp-panel-title">Scan QR Code</p>
            <div
              className={`gp-qr-frame${data.qrCodeImage ? " gp-qr-frame--clickable" : ""}`}
              onClick={() => data.qrCodeImage && setQrModalOpen(true)}
              role={data.qrCodeImage ? "button" : undefined}
              tabIndex={data.qrCodeImage ? 0 : undefined}
              aria-label={data.qrCodeImage ? "Click to enlarge QR code" : undefined}
              onKeyDown={(e) => { if (data.qrCodeImage && (e.key === "Enter" || e.key === " ")) setQrModalOpen(true); }}
            >
              {data.qrCodeImage
                ? <>
                    <img src={data.qrCodeImage} alt="Gate Pass QR" className="gp-qr-img" />
                    <div className="gp-qr-overlay no-print">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                      </svg>
                      <span>Tap to enlarge</span>
                    </div>
                  </>
                : <div className="gp-qr-empty">QR unavailable</div>
              }
            </div>
            <p className="gp-qr-passno">{data.passNumber}</p>
          </div>

          {/* Info panels */}
          <div className="gp-info-panels">

            {/* Visitor */}
            <div className="gp-info-card">
              <div className="gp-info-card__header">
                <span className="gp-info-card__icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <span className="gp-info-card__title">Visitor Info</span>
              </div>
              <InfoRow label="Full Name"       value={data.visitorName}              highlight />
              <InfoRow label="Company"         value={data.companyName}                        />
              <InfoRow label="Mobile"          value={data.mobileNumber}                       />
              <InfoRow label="No. of Visitors" value={String(data.numberOfVisitors)}           />
            </div>

            {/* Host */}
            <div className="gp-info-card">
              <div className="gp-info-card__header">
                <span className="gp-info-card__icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </span>
                <span className="gp-info-card__title">Host Info</span>
              </div>
              <InfoRow label="Host Person"  value={data.hostEmployeeName}  highlight />
              <InfoRow label="Host Email"   value={data.hostEmployeeEmail}           />
              <InfoRow label="Type of Visit" value={data.purposeOfVisit}            />
            </div>

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="gp-footer">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>This pass is valid only for the scheduled visit. Please carry a valid government-issued photo ID at the time of entry.</span>
        </div>

      </div>

      {/* ── QR Modal ── */}
      {qrModalOpen && (
        <QRModal
          image={data.qrCodeImage}
          passNumber={data.passNumber}
          onClose={() => setQrModalOpen(false)}
        />
      )}

    </div>
  );
}

export default App;