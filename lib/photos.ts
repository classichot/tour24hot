/** Destination photography for prototype slots. IDs verified live against images.unsplash.com. */
const u = (id: string, w = 1400) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const PHOTO = {
  hero: u("1490806843957-31f4c9a91c65", 1600), // Mt Fuji
  dest: {
    jp: u("1540959733332-eab4deabeeaf"), // Tokyo
    kr: u("1532649097480-b67d52743b69"), // Seoul night
    cn: u("1508804185872-d7badad00f7d"), // Zhangjiajie
    tw: u("1741004419862-5f3600cc7a97"), // Taipei 101
    vn: u("1528127269322-539801943592"), // Hoi An
    eu: u("1502602898657-3e91760cbb34"), // Paris
  } as Record<string, string>,
  pkg: {
    jp01: [u("1490806843957-31f4c9a91c65"), u("1540959733332-eab4deabeeaf"), u("1545569341-9eb8b30979d9")],
    jp02: [u("1542051841857-5f90071e7989"), u("1513407030348-c983a97b98d8"), u("1545569341-9eb8b30979d9")],
    jp03: [u("1478436127897-769e1b3f0f36"), u("1480796927426-f609979314bd"), u("1590559899731-a382839e5549")],
    jp04: [u("1551632811-561732d1e306"), u("1578271887552-5ac3a72752bc"), u("1578637387939-43c525550085")],
    kr01: [u("1532649097480-b67d52743b69"), u("1546874177-9e664107314e"), u("1538485399081-7191377e8241")],
    kr02: [u("1747683203882-25ba3f153a15"), u("1586274677440-231405a4c74c"), u("1535189043414-47a3c49a0bed")],
    cn01: [u("1564349683136-77e08dba1ef7"), u("1565967511849-76a60a516170"), u("1548013146-72479768bada")],
    cn02: [u("1508804185872-d7badad00f7d"), u("1469474968028-56623f02e42e"), u("1506905925346-21bda4d32df4")],
    tw01: [u("1741004419862-5f3600cc7a97"), u("1747687759065-0c415cc1cf28"), u("1441974231531-c6227db76b6e")],
  } as Record<string, string[]>,
};

export function destPhoto(id: string) {
  return PHOTO.dest[id] ?? PHOTO.hero;
}

export function pkgPhotos(id: string) {
  return PHOTO.pkg[id] ?? [PHOTO.hero, PHOTO.hero, PHOTO.hero];
}

export function pkgPhoto(id: string, index = 0) {
  const list = pkgPhotos(id);
  return list[index % list.length];
}
