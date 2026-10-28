# #4471 · dates have two causes

owner: DejwidD · status: known · reviewed: 2026-10-28

*This is the page as the desk sees it. The table and the desk ref are computed with the kb's own
`causes.ts` and `desk-ref.ts`.*

## What #4471 contains

Ticket #4471 holds **412 unique reports** about dates on the wrong day. They are not one bug.
They are two problems, and each needs its own ticket.

| problem | reports | ticket | outcome |
| --- | --- | --- | --- |
| The shared parser flips day and month for day-first tenants | 379 | [#1](https://github.com/DejwidD/mega-s01e03-what-it-shows/issues/1) | fixed: `fix(dates): parse dd/mm for eu locales` |
| `booking-v3` prints a month-first hint to day-first tenants | 33 | [#2](https://github.com/DejwidD/mega-s01e03-what-it-shows/issues/2) | won't fix: the booking-v3 form is retired |

Engineering closed #4471 on 5 October with these two outcomes.

### 1. Parser flips day and month (379)

The shared parser reads every date month first. Day-first tenants see their dates flipped,
for example 4 July going out as 7 April. This covers 11 tenants and every channel.

Five of these reports read as a one-day move (R-41202, R-41209, R-41236, R-41344, R-41620).
The desk files them under their cause, so they stay in this count.

### 2. The booking-v3 hint is wrong (33)

`booking-v3` prints `MM/DD/YYYY` under the date field. People at day-first tenants type what
the hint tells them, and the form reads it their way. All 33 reports are form reports from
three tenants: `alder.physio`, `copper.studio` and `pale.harbour`.

## Evidence

**412** reports merged into #4471 · **2** causes

| cause | reports | tagged as | tenants | seen | |
| --- | --- | --- | --- | --- | --- |
| `parser` | 379 | parser ×356 · hint ×23 | 11 | 2026-04-01 → 2026-10-04 | #4471 |
| `hint` | 33 | hint ×18 · parser ×15 | 3 | 2026-04-17 → 2026-09-22 | not this ticket — no ticket of its own |

5 reports read as a one-day move; filed under `parser` by tenant.

desk ref **DR-BZJ3-B1NA**
