# Personal Reports Page - Visual Guide

## Page Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ [☰ Logo]              🕌 Kanz ul Huda    [Theme] [User] [Logout] │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┬────────────────────────────────────────────┐
│                      │  My Reports                                │
│  Dashboard           │                                            │
│  Members             │  Generate and export your personal         │
│  Submissions         │  weekly and monthly Durood reports         │
│  Reports             │                                            │
│ ▶ My Reports ◀       │  ┌─────────────────────────────────────┐  │
│  Leaderboard         │  │ 📅 Generate Report                  │  │
│  Member Profiles     │  ├─────────────────────────────────────┤  │
│                      │  │ Report Type: [Weekly Report ▼]      │  │
│                      │  │ Select Date: [2026-01-17]           │  │
│                      │  │              [Generate Report]      │  │
│                      │  └─────────────────────────────────────┘  │
│                      │                                            │
│                      │  After Generating Report:                 │
│                      │  ┌──────────┬──────────┬──────────┬──────┐ │
│                      │  │  Period  │Durood ✓  │Entries   │Members│ │
│                      │  │          │          │          │      │ │
│                      │  │Jan 13-19 │  5,234   │   23     │  12  │ │
│                      │  └──────────┴──────────┴──────────┴──────┘ │
│                      │                                            │
│                      │  ┌─────────────────────────────────────┐  │
│                      │  │ 📥 Export Options                   │  │
│                      │  │ [📄 Export as CSV] [📄 Export JSON] │  │
│                      │  └─────────────────────────────────────┘  │
│                      │                                            │
│                      │  ┌─────────────────────────────────────┐  │
│                      │  │ Submission Details                  │  │
│                      │  ├──────────────┬──────┬────────┬─────┤  │
│                      │  │ Member Name  │Count │ Date   │Notes│  │
│                      │  ├──────────────┼──────┼────────┼─────┤  │
│                      │  │ Ahmed Hassan │ 250  │1/13/26 │ -   │  │
│                      │  │ Fatima Ali   │ 180  │1/13/26 │ Good│  │
│                      │  │ Usman Khan   │ 220  │1/14/26 │ -   │  │
│                      │  │ ...          │ ...  │  ...   │ ... │  │
│                      │  └──────────────┴──────┴────────┴─────┘  │
│                      │                                            │
│                      │  ┌─────────────────────────────────────┐  │
│                      │  │ Summary Statistics                  │  │
│                      │  │ ┌─────┬─────┬─────┬─────┐          │  │
│                      │  │ │5,234│ 23  │ 12  │227.6│          │  │
│                      │  │ │Total│Total│Unique│Avg  │          │  │
│                      │  │ │Dur. │Subs │Membs │/Sub │          │  │
│                      │  │ └─────┴─────┴─────┴─────┘          │  │
│                      │  └─────────────────────────────────────┘  │
│                      │                                            │
└──────────────────────┴────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Header Section

```jsx
<h1>My Reports</h1>
<p>Generate and export your personal weekly and monthly Durood reports</p>
```

### 2. Report Generator Card

```jsx
<div className="card">
  <h2>📅 Generate Report</h2>

  <select>
    <option>Weekly Report</option>
    <option>Monthly Report</option>
  </select>

  <input type="date" />
  <button>Generate Report</button>
</div>
```

### 3. Summary Cards (4 Cards - Animated Stagger)

```jsx
// Card 1: Period
<div className="card">
  <p>Period</p>
  <p className="text-2xl font-bold">Jan 13 - Jan 19</p>
</div>

// Card 2: Total Durood
<div className="card">
  <p>Total Durood</p>
  <p className="text-2xl font-bold">5,234</p>
</div>

// Card 3: Submissions
<div className="card">
  <p>Submissions</p>
  <p className="text-2xl font-bold">23</p>
</div>

// Card 4: Members
<div className="card">
  <p>Members</p>
  <p className="text-2xl font-bold">12</p>
</div>
```

### 4. Export Options Card

```jsx
<div className="card">
  <h3>📥 Export Options</h3>
  <button className="bg-green-600">📄 Export as CSV</button>
  <button className="bg-blue-600">📄 Export as JSON</button>
</div>
```

### 5. Submission Details Table

```jsx
<table>
  <thead>
    <tr>
      <th>Member Name</th>
      <th>Durood Count</th>
      <th>Submission Date</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
    {submissions.map((sub) => (
      <tr>
        <td>{sub.member.fullName}</td>
        <td>{sub.duroodCount}</td>
        <td>{formatDate(sub.date)}</td>
        <td>{sub.notes}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### 6. Summary Statistics Section

```jsx
<div className="grid grid-cols-2 md:grid-cols-4">
  <div>
    <p>Total Durood</p>
    <p className="text-2xl">5,234</p>
  </div>
  <div>
    <p>Total Submissions</p>
    <p className="text-2xl">23</p>
  </div>
  <div>
    <p>Unique Members</p>
    <p className="text-2xl">12</p>
  </div>
  <div>
    <p>Avg per Submission</p>
    <p className="text-2xl">227.6</p>
  </div>
</div>
```

## Color Scheme

### Light Mode

```css
Card Background:     #FFFFFF (white)
Card Border:         #E5E7EB (gray-300)
Text Primary:        #111827 (gray-900)
Text Secondary:      #4B5563 (gray-600)
Accent Color:        #3B82F6 (primary-600)
Summary Bg:          #F9FAFB (gray-50)
```

### Dark Mode

```css
Card Background:     #1F2937 (gray-800)
Card Border:         #374151 (gray-700)
Text Primary:        #F3F4F6 (white)
Text Secondary:      #9CA3AF (gray-400)
Accent Color:        #60A5FA (primary-400)
Summary Bg:          #111827 (gray-700)
```

## Animations

### Entrance Animations (Staggered)

```
Header:              fade-in + slide-down (0ms)
Report Generator:    fade-in + slide-up (100ms)
Summary Card 1:      slide-in-left (300ms)
Summary Card 2:      slide-in-left (350ms)
Summary Card 3:      slide-in-left (400ms)
Summary Card 4:      slide-in-left (450ms)
Export Options:      fade-in + slide-up (500ms)
Submission Table:    fade-in + slide-up (550ms)
Summary Stats:       fade-in + slide-up (600ms)
```

### Interactive Animations

```
Buttons:
  Hover:  Scale 1.05
  Tap:    Scale 0.95

Select/Input:
  Focus:  Ring 2px (primary color)
  Error:  Ring 2px (red color)

Table Rows:
  Hover:  bg-gray-50 (light) or bg-gray-700 (dark)
```

## Data Flow

```
Component Mount
       ↓
fetchReportData() {
  GET /api/members
  GET /api/submissions  (parallel)
}
       ↓
User selects report type & date
       ↓
User clicks "Generate Report"
       ↓
generateWeeklyReport() or generateMonthlyReport()
       ↓
Filter submissions by date range
Calculate totals and metrics
       ↓
Display results with animations
       ↓
User clicks "Export as CSV" or "Export as JSON"
       ↓
Generate file client-side
Create Blob and trigger download
```

## Responsive Breakpoints

### Desktop (lg: 1024px and above)

```
Main layout: Sidebar + Content
Grid: 4 columns for summary cards
Table: Full width with all columns visible
```

### Tablet (md: 768px to 1023px)

```
Main layout: Collapsible sidebar
Grid: 2 columns for summary cards
Table: Full width, optimized spacing
```

### Mobile (below 768px)

```
Main layout: Hamburger menu sidebar
Grid: 1-2 columns for summary cards
Table: Horizontal scroll or stacked view
Buttons: Full width where possible
```

## Status Messages

### Loading State

```
[Spinner Animation]
Loading...
```

### Empty State

```
No submissions found for this period
```

### Success State

```
Report generated successfully
Summary cards displayed
Export buttons available
```

## User Workflow

### Step 1: Navigate to My Reports

- Click "My Reports" in sidebar navigation
- Page loads with spinner
- Report generator becomes visible

### Step 2: Select Report Parameters

- Choose "Weekly Report" or "Monthly Report"
- Pick a date within desired period
- Click "Generate Report"

### Step 3: View Results

- Summary cards animate in
- Submission details table populates
- Statistics section displays

### Step 4: Export (Optional)

- Click "Export as CSV" to download Excel-compatible file
- OR click "Export as JSON" to download structured data
- File saves to Downloads folder

### Step 5: Share or Archive

- Share exported file with team leader
- Store in personal records
- Use for further analysis

## Keyboard Navigation

```
Tab:           Navigate between form elements and buttons
Enter:         Activate buttons, submit forms
Shift+Tab:     Navigate backward
Escape:        Close modals (if implemented)
```

## Accessibility Features

- Proper `<label>` associations
- ARIA labels on buttons
- Color not sole indicator (icons + text)
- Sufficient color contrast (WCAG AA)
- Keyboard navigable
- Focus indicators
- Semantic HTML structure
