from datetime import datetime, timedelta, timezone

BKK = timezone(timedelta(hours=7))


def last_week_range():
    today = datetime.now(BKK)
    last_sunday = today - timedelta(days=today.weekday() + 1)
    last_monday = last_sunday - timedelta(days=6)
    return last_monday.date(), last_sunday.date()


def last_month_range():
    today = datetime.now(BKK)
    first_current = today.replace(day=1)
    last_end = first_current - timedelta(days=1)
    start = last_end.replace(day=1)
    return start.date(), last_end.date()
