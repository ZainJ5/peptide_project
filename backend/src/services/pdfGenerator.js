'use strict';

const PDFDocument = require('pdfkit');
const dayjs       = require('dayjs');

/**
 * @param {object} params
 * @param {object} params.groupedEvents   Output of scheduleEngine.groupEventsByMonth()
 * @param {string} params.scheduleName    User's schedule name
 * @param {string} params.userName        User's first + last name
 * @param {string[]} params.months        Array of "YYYY-MM" strings to include (all if omitted)
 * @returns {PDFDocument}                 Pipe this to res or a file stream
 *
 * Usage:
 *   const doc = generateCalendarPdf({ groupedEvents, scheduleName, userName });
 *   res.setHeader('Content-Type', 'application/pdf');
 *   doc.pipe(res);
 *   doc.end();
 */
function generateCalendarPdf({ groupedEvents, scheduleName = 'Peptide Schedule', userName = '', months }) {
  const doc = new PDFDocument({
    size:    'LETTER',
    layout:  'landscape',
    margins: { top: 40, bottom: 40, left: 36, right: 36 },
    info: {
      Title:   `${scheduleName} — Peptide Calendar`,
      Author:  'MyPeptideDosages.com',
      Subject: 'Personalized Peptide Dosing Schedule',
    },
  });

  const COLORS = {
    headerBg:    '#2E2A8F',
    headerText:  '#FFFFFF',
    dayHeader:   '#25324A',
    gridLine:    '#D8E0EC',
    amChip:      '#1FA971',
    pmChip:      '#2E7BE8',
    restChip:    '#8A94A6',
    eventText:   '#1F2937',
    restText:    '#6C778C',
    footerText:  '#8C96A8',
    pageNumbers: '#555555',
    todayBg:     '#FFF9C4',
    pageBg:      '#F5F7FC',
    cardBg:      '#FFFFFF',
    dayCapBg:    '#EEF2FA',
    weekendCapBg:'#E8EDF8',
  };

  const LEFT = 36;
  const TOP = 40;
  const RIGHT = 36;
  const BOTTOM = 40;

  const PAGE_W = doc.page.width - LEFT - RIGHT;
  const PAGE_H = doc.page.height - TOP - BOTTOM;
  const COL_W  = PAGE_W / 7;

  const sortedMonths = months
    ? [...months].sort()
    : Object.keys(groupedEvents).sort();

  const eventsByDate = {};
  sortedMonths.forEach((monthKey) => {
    const monthEvents = groupedEvents[monthKey] || {};
    Object.entries(monthEvents).forEach(([date, events]) => {
      eventsByDate[date] = (eventsByDate[date] || []).concat(events || []);
    });
  });

  const dateKeys = Object.keys(eventsByDate).sort();
  if (dateKeys.length === 0) {
    doc.rect(LEFT, TOP, PAGE_W, 64).fill(COLORS.headerBg);
    doc.fillColor(COLORS.headerText).font('Helvetica-Bold').fontSize(24).text('Peptide Schedule', LEFT, TOP + 18, { width: PAGE_W, align: 'center' });
    doc.fillColor(COLORS.eventText).font('Helvetica').fontSize(12).text('No generated calendar events found for the selected schedule/months.', LEFT, TOP + 90, { width: PAGE_W, align: 'center' });
    return doc;
  }

  const rangeStart = dayjs(dateKeys[0]).startOf('week');
  const rangeEnd = dayjs(dateKeys[dateKeys.length - 1]).endOf('week');
  const allDates = [];
  let cursor = rangeStart;
  while (cursor.isBefore(rangeEnd) || cursor.isSame(rangeEnd, 'day')) {
    allDates.push(cursor.format('YYYY-MM-DD'));
    cursor = cursor.add(1, 'day');
  }

  const weekChunks = [];
  for (let i = 0; i < allDates.length; i += 7) weekChunks.push(allDates.slice(i, i + 7));

  const maxEventsPerDay = dateKeys.reduce((max, key) => Math.max(max, (eventsByDate[key] || []).length), 0);
  const weeksPerPage = maxEventsPerDay <= 6 ? 2 : 1;

  const pageChunks = [];
  for (let i = 0; i < weekChunks.length; i += weeksPerPage) pageChunks.push(weekChunks.slice(i, i + weeksPerPage));

  pageChunks.forEach((weeksOnPage, pageIndex) => {
    if (pageIndex > 0) doc.addPage();

    const pageStart = dayjs(weeksOnPage[0][0]);
    const lastWeek = weeksOnPage[weeksOnPage.length - 1];
    const pageEnd = dayjs(lastWeek[lastWeek.length - 1]);
    const pageTitle = `${pageStart.format('MMM D')} - ${pageEnd.format('MMM D, YYYY')}`;

    doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.pageBg);
    doc.rect(LEFT, TOP, PAGE_W, 62).fill(COLORS.headerBg);
    doc.fillColor(COLORS.headerText).font('Helvetica-Bold').fontSize(22).text(pageTitle, LEFT, TOP + 14, { width: PAGE_W, align: 'center' });
    doc.fillColor(COLORS.headerText).font('Helvetica').fontSize(10).text(`${scheduleName}${userName ? ` — ${userName}` : ''}`, LEFT, TOP + 40, { width: PAGE_W, align: 'center' });

    const legendY = TOP + 66;
    _drawLegendItem(doc, LEFT + 2, legendY, 'AM', COLORS.amChip);
    _drawLegendItem(doc, LEFT + 58, legendY, 'PM', COLORS.pmChip);
    _drawLegendItem(doc, LEFT + 114, legendY, 'REST', COLORS.restChip);

    const gridTop = TOP + 84;
    const totalGridHeight = PAGE_H - 112;
    const weekGap = weeksOnPage.length > 1 ? 8 : 0;
    const weekSectionH = Math.floor((totalGridHeight - weekGap * (weeksOnPage.length - 1)) / weeksOnPage.length);
    const cardH = weekSectionH;
    const lineH = weeksOnPage.length > 1 ? 11 : 14;
    const itemTop = 38;
    const cardGap = 4;
    const cardW = COL_W - cardGap;
    const maxLines = Math.max(4, Math.floor((cardH - itemTop - 12) / lineH));

    weeksOnPage.forEach((weekDates, weekRowIdx) => {
      const rowTop = gridTop + weekRowIdx * (weekSectionH + weekGap);

      weekDates.forEach((dateStr, i) => {
        const x = LEFT + i * COL_W + cardGap / 2;
        const y = rowTop;
        const events = (eventsByDate[dateStr] || []).slice().sort((a, b) => {
          const av = String(a.timeOfDay || '');
          const bv = String(b.timeOfDay || '');
          return av.localeCompare(bv);
        });

        const dayObj = dayjs(dateStr);
        const dayIdx = dayObj.day();
        const capBg = dayIdx === 0 || dayIdx === 6 ? COLORS.weekendCapBg : COLORS.dayCapBg;

        doc.roundedRect(x, y, cardW, cardH, 6).fillAndStroke(COLORS.cardBg, COLORS.gridLine);
        doc.roundedRect(x + 1, y + 1, cardW - 2, 28, 5).fill(capBg);
        doc.fillColor(COLORS.dayHeader).font('Helvetica-Bold').fontSize(9).text(dayObj.format('ddd'), x + 8, y + 8, { width: cardW - 16 });
        doc.fillColor(COLORS.eventText).font('Helvetica-Bold').fontSize(11).text(dayObj.format('MMM D'), x + 8, y + 17, { width: cardW - 16 });

        if (events.length === 0) {
          doc.fillColor(COLORS.restText).font('Helvetica').fontSize(8.5).text('No injections', x + 8, y + itemTop + 2, { width: cardW - 16 });
          return;
        }

        const visible = events.slice(0, maxLines);
        visible.forEach((evt, idx) => {
          const lineY = y + itemTop + idx * lineH;
          const label = _formatEventLine(evt);
          _drawEventPill(doc, {
            x: x + 7,
            y: lineY,
            w: cardW - 14,
            h: weeksOnPage.length > 1 ? 9 : 11,
            text: label,
            evt,
            colors: COLORS,
          });
        });

        if (events.length > maxLines) {
          doc.fillColor(COLORS.restText).font('Helvetica-Bold').fontSize(7.5).text(`+${events.length - maxLines} more`, x + 8, y + cardH - 12, { width: cardW - 16 });
        }
      });
    });

    doc.fillColor(COLORS.footerText).font('Helvetica').fontSize(8).text('Generated by MyPeptideDosages.com  |  For research purposes only', LEFT, doc.page.height - BOTTOM - 10, {
      width: PAGE_W,
      align: 'center',
    });
  });

  return doc;
}


/**
 * Draw a small colored chip / badge with text.
 */
function _formatEventLine(evt) {
  if (evt.isRestDay) return 'REST';

  const peptideName = evt.peptide?.name || evt.peptideName || 'Peptide';
  const compactName = String(peptideName)
    .replace(/\s*\+\s*/g, '+')
    .replace(/\s+/g, ' ')
    .trim();
  const timeLabel = evt.timeOfDay || 'AM';
  const doseUnits = evt.doseUnits != null ? `${evt.doseUnits}u` : '';
  return `${timeLabel} ${compactName}${doseUnits ? ` ${doseUnits}` : ''}`;
}

function _drawLegendItem(doc, x, y, label, color) {
  doc.roundedRect(x, y, 12, 8, 3).fill(color);
  doc.fillColor('#EAF0FB').font('Helvetica-Bold').fontSize(8).text(label, x + 16, y - 1, { width: 40 });
}

function _drawEventPill(doc, { x, y, w, h, text, evt, colors }) {
  const fill = evt.isRestDay
    ? '#EEF1F7'
    : evt.timeOfDay === 'PM'
      ? '#EAF2FF'
      : '#EAFBF3';

  const border = evt.isRestDay
    ? '#D4DAE6'
    : evt.timeOfDay === 'PM'
      ? '#C9DDFE'
      : '#C7ECD8';

  const textColor = evt.isRestDay
    ? colors.restText
    : colors.eventText;

  doc.roundedRect(x, y, w, h, 4).fillAndStroke(fill, border);
  doc.fillColor(textColor).font('Helvetica-Bold').fontSize(5.8).text(text, x + 3, y + 2, {
    width: w - 6,
    height: h - 2,
    lineBreak: false,
  });
}

module.exports = { generateCalendarPdf };
