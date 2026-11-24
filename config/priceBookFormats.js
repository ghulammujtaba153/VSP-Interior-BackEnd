export const FORMAT_PROFILES = {
  enko_wholesale: {
    label: 'ENKO Wholesale',
    detect: (h) => h.some((x) => x.includes('product code')) && h.some((x) => x.includes('wholesale')),
  },
  vsp_tiered: {
    label: 'VSP Tiered Pricelist',
    detect: (h) => h.some((x) => x === 'item' || x.includes('item')) && h.filter((x) => x.includes('qty range')).length >= 1,
  },
  psp_simple: {
    label: 'PSP Plastic Sheets',
    detect: (h) => h.includes('sku') && h.some((x) => x === 'price' || x.includes('price')),
  },
  p3_hardware: {
    label: 'P3 Hardware',
    detect: (h) => h.some((x) => x.includes('art')) && h.includes('size'),
  },
  vspint_simple: {
    label: 'VSPINT Fasteners',
    detect: (h) => h.includes('product') && h.some((x) => x.includes('net price')),
  },
}

export const FORMAT_OPTIONS = Object.entries(FORMAT_PROFILES).map(([key, v]) => ({
  key,
  label: v.label,
}))
