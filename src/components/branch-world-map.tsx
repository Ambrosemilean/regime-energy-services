"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import TrackedLink from "@/components/analytics/tracked-link";
import "leaflet/dist/leaflet.css";

// Minimal structural typings for the Leaflet API surface used here.
type LeafletLatLng = [number, number];

type LeafletMarker = {
  on(event: string, handler: () => void): LeafletMarker;
  addTo(map: LeafletMap): LeafletMarker;
  getElement(): HTMLElement | null;
  bindPopup(
    content: string,
    options?: {
      maxWidth?: number;
      minWidth?: number;
      className?: string;
    }
  ): LeafletMarker;
  bindTooltip(
    content: string,
    options?: {
      permanent?: boolean;
      direction?: string;
      offset?: [number, number];
      className?: string;
    }
  ): LeafletMarker;
};

type LeafletMap = {
  setView(center: LeafletLatLng, zoom: number): LeafletMap;
  flyTo(
    center: LeafletLatLng,
    zoom: number,
    options?: { duration?: number }
  ): LeafletMap;
  fitBounds(
    bounds: LeafletLatLng[],
    options?: { padding?: [number, number]; maxZoom?: number }
  ): LeafletMap;
  invalidateSize(options?: { animate?: boolean }): void;
  on(event: string, handler: () => void): void;
  remove(): void;
};

type LeafletNamespace = {
  map(
    el: HTMLElement,
    options?: { scrollWheelZoom?: boolean }
  ): LeafletMap;
  tileLayer(
    url: string,
    options: {
      attribution: string;
      maxZoom: number;
      subdomains?: string;
    }
  ): {
    addTo(map: LeafletMap): void;
    on(event: string, handler: () => void): void;
  };
  marker(
    center: LeafletLatLng,
    options?: {
      title?: string;
      keyboard?: boolean;
      icon?: unknown;
    }
  ): LeafletMarker;

  divIcon(options: {
    className: string;
    html: string;
    iconSize: [number, number];
    iconAnchor: [number, number];
  }): unknown;
};

type MapBranch = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  description: string | null;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Popup content for ONE branch, built strictly from that branch's own
 * record. Fields that are null/empty are omitted, and the Get Directions
 * button uses the actual stored coordinates (external Google Maps link —
 * no API involved).
 */
function buildBranchPopupHtml(branch: MapBranch): string {
  const rows: string[] = [];

  if (branch.address) {
    rows.push(
      `<p class="regime-popup-address">${escapeHtml(branch.address)}</p>`
    );
  }
  if (branch.phone) {
    rows.push(
      `<p class="regime-popup-contact"><a href="tel:${escapeHtml(
        branch.phone.replace(/\s+/g, "")
      )}">${escapeHtml(branch.phone)}</a></p>`
    );
  }
  if (branch.whatsapp) {
    rows.push(
      `<p class="regime-popup-contact"><a href="https://wa.me/${branch.whatsapp.replace(
        /\D/g,
        ""
      )}" target="_blank" rel="noopener noreferrer">WhatsApp</a></p>`
    );
  }
  if (branch.description) {
    rows.push(
      `<p class="regime-popup-description">${escapeHtml(branch.description)}</p>`
    );
  }

  const actions: string[] = [];

  if (branch.latitude !== null && branch.longitude !== null) {
    actions.push(
      `<a class="regime-popup-directions" href="https://www.google.com/maps/dir/?api=1&destination=${branch.latitude},${branch.longitude}" target="_blank" rel="noopener noreferrer">Get Directions</a>`
    );
  }

  return `<div class="regime-branch-popup-inner">
    <p class="regime-popup-brand">Regime Energy Services</p>
    <h3 class="regime-popup-title">${escapeHtml(branch.name)}</h3>
    ${rows.join("")}
    ${actions.length ? `<div class="regime-popup-actions">${actions.join("")}</div>` : ""}
  </div>`;
}

/**
 * "Find a Branch Near You" — a real, zoomable map of Nigeria with the
 * branch locations marked directly on it.
 *
 * Built on Leaflet (loaded from CDN at runtime, no npm dependency) with
 * OpenStreetMap tiles, so no API key or billing account is required.
 * Clicking a branch marker reveals that branch's details below the map.
 */
export default function BranchWorldMap({
  branches,
}: {
  branches: MapBranch[];
}) {
  const located = useMemo(
    () =>
      branches.filter(
        (branch) => branch.latitude !== null && branch.longitude !== null
      ),
    [branches]
  );

  // Nothing is revealed until the visitor picks a branch on the map.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fullscreen (expanded) map view.
  const [isFullscreen, setIsFullscreen] = useState(false);

  const selected = useMemo(
    () => branches.find((branch) => branch.id === selectedId) ?? null,
    [branches, selectedId]
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<Record<string, unknown>>({});
  const resizeHandlerRef = useRef<(() => void) | null>(null);

  // Keep a ref to the latest selection handler so marker listeners built
  // once can always call the freshest setState.
  const selectHandlerRef = useRef<(id: string | null) => void>(() => { });

  useEffect(() => {
    selectHandlerRef.current = (id: string | null) => setSelectedId(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | null = null;
    const leafletMarkers: Record<string, LeafletMarker> = {};

    async function init() {
      // Leaflet is bundled from npm (no CDN dependency — CDN assets are
      // blocked in some environments by ORB/CORS rules).
      const L = (await import("leaflet")).default as unknown as LeafletNamespace;

      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        scrollWheelZoom: false, // avoid hijacking page scroll; zoom controls + pinch still work
      }).setView([8.9, 8.4], 6); // centered on Nigeria

      // Official OpenStreetMap raster tiles — free, key-less, and available
      // to every origin (CARTO's hosted tiles now block unregistered
      // domains with an "API key required" response). Usage policy: light,
      // cached traffic with visible attribution, which is what this map is.
      // https://operations.osmfoundation.org/policies/tiles/
      const tileLayer = L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }
      );

      tileLayer.addTo(map);

      // Tiles that arrive after the container settled can leave the map
      // partially painted — repaint whenever a tile finishes loading.
      tileLayer.on("load", () => map?.invalidateSize({ animate: false }));
      map.on("load", () => map?.invalidateSize({ animate: false }));

      const createdMap = map;

      if (!createdMap) return;

      located.forEach((branch) => {
        const marker = L.marker([branch.latitude!, branch.longitude!], {
          title: branch.name,
          keyboard: true,
          icon: L.divIcon({
            className: "regime-branch-pin",
            html: `<span class="regime-branch-pin-dot"></span>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          }),
        });

        marker.on("click", () => {
          selectHandlerRef.current(branch.id);
        });

        // Per-branch popup: only THIS branch's details, generated from its
        // own record. Empty/missing fields are omitted entirely.
        marker.bindPopup(
          buildBranchPopupHtml(branch),
          {
            maxWidth: 280,
            minWidth: 240,
            className: "regime-branch-popup",
          }
        );

        // Permanent name label beside each pin — every branch location is
        // directly readable on the map without clicking.
        marker.bindTooltip(`<strong>${branch.name}</strong>`, {
          permanent: true,
          direction: "right",
          offset: [12, 0],
          className: "regime-branch-tooltip",
        });

        marker.addTo(createdMap);
        leafletMarkers[branch.id] = marker;
      });

      // Fit all branch pins nicely within the viewport, but start at street-
      // level detail (roads, communities, landmarks) rather than a zoomed-out
      // overview — maxZoom here means "do not zoom OUT past this".
      if (located.length === 1) {
        const [branch] = located;
        createdMap.flyTo([branch.latitude!, branch.longitude!], 15, {
          duration: 0,
        });
      } else if (located.length > 1) {
        createdMap.fitBounds(
          located.map(
            (branch) => [branch.latitude!, branch.longitude!] as [number, number]
          ),
          { padding: [60, 60], maxZoom: 16 }
        );
      }

      // The container may still be settling when Leaflet measures it —
      // repaint once now, on the next frame, and on every window resize
      // so the map always fills its full area.
      createdMap.invalidateSize({ animate: false });
      requestAnimationFrame(() => {
        if (!cancelled) createdMap.invalidateSize({ animate: false });
      });

      const onResize = () => createdMap.invalidateSize({ animate: false });
      resizeHandlerRef.current = onResize;
      window.addEventListener("resize", onResize);

      mapRef.current = map;
      markersRef.current = leafletMarkers;
    }

    init();

    return () => {
      cancelled = true;

      if (resizeHandlerRef.current) {
        window.removeEventListener("resize", resizeHandlerRef.current);
        resizeHandlerRef.current = null;
      }

      if (mapRef.current) {
        (mapRef.current as LeafletMap).remove();
        mapRef.current = null;
        markersRef.current = {};
      }
    };
  }, [located]);

  // Fly to and highlight the selected branch whenever selection changes.
  useEffect(() => {
    const map = mapRef.current as LeafletMap | null;
    const markers = markersRef.current as Record<string, LeafletMarker>;

    if (!map || Object.keys(markers).length === 0) return;

    Object.entries(markers).forEach(([id, marker]) => {
      const el = marker.getElement()?.querySelector(
        ".regime-branch-pin-dot"
      ) as HTMLElement | null;

      if (el) {
        el.classList.toggle("regime-branch-pin-selected", id === selectedId);
      }
    });

    const branch = branches.find((item) => item.id === selectedId);

    if (branch && branch.latitude !== null && branch.longitude !== null) {
      map.flyTo([branch.latitude, branch.longitude], 12, { duration: 0.8 });
    }
  }, [selectedId, branches]);

  return (
    <div>
      {/* ----------------------- Zoomable Nigeria map ----------------------- */}
      <div className="regime-card overflow-hidden">
        <div
          className={
            isFullscreen
              ? "fixed inset-0 z-[1000]"
              : "relative h-[480px] w-full sm:h-[560px]"
          }
        >
          <div
            ref={containerRef}
            className="absolute inset-0 z-0"
            role="application"
            aria-label="Interactive map of Nigeria showing Regime Energy Services branch locations"
          />

          {/* Return the map to the full branch view after exploring a pin. */}
          {located.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedId(null);
                const map = mapRef.current as LeafletMap | null;
                if (!map) return;

                if (located.length === 1) {
                  const [branch] = located;
                  map.flyTo([branch.latitude!, branch.longitude!], 12, {
                    duration: 0.8,
                  });
                } else {
                  map.fitBounds(
                    located.map(
                      (branch) =>
                        [branch.latitude!, branch.longitude!] as [number, number]
                    ),
                    { padding: [40, 40], maxZoom: 10 }
                  );
                }
              }}
              className="absolute left-3 top-3 z-[600] rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-md transition hover:bg-gray-50"
            >
              Show all branches
            </button>
          )}

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !isFullscreen;
              setIsFullscreen(next);
              // Repaint after the layout change so tiles fill the frame.
              requestAnimationFrame(() => {
                (mapRef.current as LeafletMap | null)?.invalidateSize({
                  animate: false,
                });
              });
            }}
            aria-label={isFullscreen ? "Exit fullscreen map" : "View map fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            className="absolute right-3 top-3 z-[600] flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gray-700 shadow-md transition hover:bg-gray-50"
          >
            {isFullscreen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M9 3H3v6M15 21h6v-6M3 15v6h6M21 9V3h-6" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 15v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>

          {/* Hint while nothing is selected */}
          {!selected && located.length > 0 && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-[500] -translate-x-1/2 rounded-full bg-slate-950/75 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-sm">
              Click a location pin to view branch details
            </div>
          )}

          {/* No coordinates configured */}
          {located.length === 0 && (
            <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/80 p-6 text-center">
              <p className="max-w-sm text-sm font-medium text-gray-700">
                Branch locations will appear here once coordinates are set
                for each branch in the admin dashboard.
              </p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gray-100 bg-white px-5 py-3 text-xs text-gray-600">
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 rounded-full border-2 border-white bg-regime-blue"
            />
            Branch location
          </span>

          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 rounded-full border-2 border-white bg-regime-red"
            />
            Selected branch
          </span>

          <span className="text-gray-400">
            Click a marker to view branch details · fullscreen for the full map
          </span>
        </div>
      </div>

      {/* -------- Details (hidden until a pin on the map is clicked) -------- */}
      {selected && (
        <div className="regime-card mt-6 flex flex-col overflow-hidden md:flex-row">
          {selected.image_url ? (
            <div className="relative h-56 w-full shrink-0 overflow-hidden bg-gray-100 md:h-auto md:w-2/5">
              <Image
                src={selected.image_url}
                alt={selected.name}
                fill
                quality={85}
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          ) : null}

          <div className="flex flex-1 flex-col p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Link
                  href={`/branches/${selected.slug || selected.id}`}
                  className="hover:text-regime-blue"
                >
                  {selected.name}
                </Link>
              </h3>

              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Hide branch details"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selected.address && (
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {selected.address}
              </p>
            )}

            {selected.description && (
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {selected.description}
              </p>
            )}

            <div className="mt-auto flex flex-wrap gap-2.5 pt-5">
              {selected.phone && (
                <TrackedLink
                  href={`tel:${selected.phone}`}
                  event="phone_click"
                  label={selected.name}
                  target=""
                  className="rounded-lg bg-regime-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-regime-blue-dark"
                >
                  Call Branch
                </TrackedLink>
              )}

              {selected.whatsapp && (
                <TrackedLink
                  href={`https://wa.me/${selected.whatsapp.replace(
                    /\D/g,
                    ""
                  )}?text=${encodeURIComponent(
                    `Hello ${selected.name} branch, I would like to order gas.`
                  )}`}
                  event="whatsapp_click"
                  label={selected.name}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  Order Gas
                </TrackedLink>
              )}

              {selected.google_maps_url && (
                <TrackedLink
                  href={selected.google_maps_url}
                  event="maps_click"
                  label={selected.name}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                >
                  Open in Maps
                </TrackedLink>
              )}

              {selected.latitude !== null && selected.longitude !== null && (
                <TrackedLink
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`}
                  event="maps_click"
                  label={selected.name}
                  className="rounded-lg bg-regime-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-regime-blue-dark"
                >
                  Get Directions
                </TrackedLink>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
