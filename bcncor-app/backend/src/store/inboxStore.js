/**
 * store/inboxStore.js
 *
 * Shared in-memory inbox used by all workflow controllers
 * (blog, competitor, news, etc.).  Import this module and
 * push / read items directly — Node's module cache keeps the
 * same array alive for the lifetime of the process.
 */

const inboxItems = [];

module.exports = { inboxItems };