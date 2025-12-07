from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
from app.models.db import db
from app.utils.executor import executor
from app.models.schemas import LogStatus
import uuid
from datetime import datetime
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AutomationScheduler:
    """Manage scheduled automation executions"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.running_jobs = {}
    
    async def start(self):
        """Start the scheduler and load existing jobs"""
        logger.info("Starting automation scheduler...")
        
        # Load existing scheduled jobs from database
        await self.load_scheduled_jobs()
        
        # Start the scheduler
        self.scheduler.start()
        
        logger.info("Scheduler started successfully")
    
    async def stop(self):
        """Stop the scheduler"""
        logger.info("Stopping scheduler...")
        self.scheduler.shutdown()
        logger.info("Scheduler stopped")
    
    async def load_scheduled_jobs(self):
        """Load all active scheduled jobs from database"""
        jobs = await db.get_active_scheduled_jobs()
        
        for job in jobs:
            try:
                await self.schedule_automation(
                    automation_id=job["automation_id"],
                    user_id=job["user_id"],
                    cron_expression=job.get("cron_expression"),
                    schedule_time=job.get("next_run"),
                    job_id=job["job_id"]
                )
            except Exception as e:
                logger.error(f"Failed to load job {job['job_id']}: {str(e)}")
    
    async def schedule_automation(
        self,
        automation_id: str,
        user_id: str,
        cron_expression: str = None,
        schedule_time: datetime = None,
        job_id: str = None
    ):
        """Schedule an automation for execution"""
        
        if not job_id:
            job_id = f"automation_{automation_id}_{uuid.uuid4()}"
        
        # Remove existing job if it exists
        if job_id in self.running_jobs:
            self.scheduler.remove_job(job_id)
        
        # Determine trigger type
        if cron_expression:
            trigger = CronTrigger.from_crontab(cron_expression)
        elif schedule_time:
            if isinstance(schedule_time, str):
                schedule_time = datetime.fromisoformat(schedule_time.replace("Z", "+00:00"))
            trigger = DateTrigger(run_date=schedule_time)
        else:
            raise ValueError("Either cron_expression or schedule_time must be provided")
        
        # Add job to scheduler
        job = self.scheduler.add_job(
            self._execute_scheduled_automation,
            trigger=trigger,
            id=job_id,
            args=[automation_id, user_id],
            replace_existing=True
        )
        
        self.running_jobs[job_id] = job
        
        logger.info(f"Scheduled automation {automation_id} with job_id {job_id}")
        
        return job_id
    
    async def unschedule_automation(self, job_id: str):
        """Remove a scheduled automation"""
        
        try:
            self.scheduler.remove_job(job_id)
            if job_id in self.running_jobs:
                del self.running_jobs[job_id]
            logger.info(f"Unscheduled job {job_id}")
        except Exception as e:
            logger.error(f"Failed to unschedule job {job_id}: {str(e)}")
    
    async def _execute_scheduled_automation(self, automation_id: str, user_id: str):
        """Execute a scheduled automation"""
        
        log_id = str(uuid.uuid4())
        
        try:
            logger.info(f"Executing scheduled automation {automation_id}")
            
            # Get automation details
            automation = await db.get_automation(automation_id, user_id)
            
            if not automation or automation["status"] != "active":
                logger.warning(f"Automation {automation_id} is not active, skipping")
                return
            
            # Get steps
            steps = await db.get_steps(automation_id)
            
            if not steps:
                logger.warning(f"No steps found for automation {automation_id}")
                return
            
            # Get integrations
            integrations_list = await db.get_integrations(user_id)
            integrations = {
                integration["type"]: integration
                for integration in integrations_list
                if integration["is_active"]
            }
            
            # Execute automation
            results = await executor.execute_automation(steps, integrations)
            
            # Check if all steps succeeded
            all_success = all(r.get("status") == "success" for r in results)
            
            # Create log
            await db.create_log({
                "id": log_id,
                "user_id": user_id,
                "automation_id": automation_id,
                "status": LogStatus.SUCCESS if all_success else LogStatus.ERROR,
                "payload": {"results": results, "scheduled": True},
                "error_message": None if all_success else "One or more steps failed"
            })
            
            logger.info(f"Automation {automation_id} executed successfully")
        
        except Exception as e:
            logger.error(f"Failed to execute automation {automation_id}: {str(e)}")
            
            # Create error log
            await db.create_log({
                "id": log_id,
                "user_id": user_id,
                "automation_id": automation_id,
                "status": LogStatus.ERROR,
                "payload": {"scheduled": True},
                "error_message": str(e)
            })


# Global scheduler instance
scheduler = AutomationScheduler()


async def start_scheduler():
    """Start the scheduler - called from main.py"""
    await scheduler.start()


async def stop_scheduler():
    """Stop the scheduler - called from main.py"""
    await scheduler.stop()