import { formatDistanceToNowStrict, format } from "date-fns";

export const formatRelative = (iso: string) =>
  `${formatDistanceToNowStrict(new Date(iso), { addSuffix: true })}`;

export const formatTimestamp = (iso: string) => format(new Date(iso), "MMM d, HH:mm:ss");

export const titleFromId = (id: string) =>
  id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
