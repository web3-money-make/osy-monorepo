const SYNC_TERM = process.env.NEXT_PUBLIC_SYNC_TERM
  ? parseInt(process.env.NEXT_PUBLIC_SYNC_TERM)
  : 6000;

export default SYNC_TERM;
