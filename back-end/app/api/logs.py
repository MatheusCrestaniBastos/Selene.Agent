from fastapi import APIRouter, Depends
from app.models.schemas import Log, DashboardStats, LogStatus
from app.models.db import db
from app.utils.secure import get_current_user
from typing import List
from datetime import datetime, timedelta


router = APIRouter(prefix="/logs", tags=["Logs"])


@router.get("/", response_model=List[Log])
async def get_logs(
    current_user: dict = Depends(get_current_user),
    limit: int = 50
):
    """Get execution logs for current user"""
    logs = await db.get_logs(current_user["id"], limit=limit)
    return logs


@router.get("/today", response_model=List[Log])
async def get_today_logs(current_user: dict = Depends(get_current_user)):
    """Get today's execution logs"""
    logs = await db.get_logs_today(current_user["id"])
    return logs


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get dashboard statistics"""
    
    # Get all automations
    automations = await db.get_automations(current_user["id"])
    total_automations = len(automations)
    active_automations = len([a for a in automations if a["status"] == "active"])
    
    # Get today's logs
    today_logs = await db.get_logs_today(current_user["id"])
    executions_today = len(today_logs)
    
    # Calculate success rate
    if executions_today > 0:
        successful = len([log for log in today_logs if log["status"] == LogStatus.SUCCESS])
        success_rate = (successful / executions_today) * 100
    else:
        success_rate = 0.0
    
    # Get recent logs
    recent_logs = await db.get_logs(current_user["id"], limit=10)
    
    return {
        "total_automations": total_automations,
        "active_automations": active_automations,
        "executions_today": executions_today,
        "success_rate": round(success_rate, 2),
        "recent_logs": recent_logs
    }


@router.get("/stats/period")
async def get_period_stats(
    current_user: dict = Depends(get_current_user),
    days: int = 7
):
    """Get execution statistics for a period"""
    
    # This is a simplified version
    # In production, you'd want to optimize this query
    
    all_logs = await db.get_logs(current_user["id"], limit=1000)
    
    # Filter by period
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    period_logs = [
        log for log in all_logs
        if datetime.fromisoformat(log["executed_at"].replace("Z", "+00:00")) > cutoff_date
    ]
    
    # Group by day
    stats_by_day = {}
    for log in period_logs:
        date = log["executed_at"][:10]  # Get date part
        
        if date not in stats_by_day:
            stats_by_day[date] = {
                "date": date,
                "total": 0,
                "success": 0,
                "error": 0
            }
        
        stats_by_day[date]["total"] += 1
        
        if log["status"] == LogStatus.SUCCESS:
            stats_by_day[date]["success"] += 1
        else:
            stats_by_day[date]["error"] += 1
    
    return {
        "period_days": days,
        "stats": list(stats_by_day.values())
    }