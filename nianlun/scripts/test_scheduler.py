import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch
import nianlun as n
import scheduler as s
from setup import Setup


class ScheduleTests(unittest.TestCase):
    schedule={'timezone':'Asia/Singapore','growth_hours':[10,12,14,16,18,20],'report_weekday':'TH','report_hour':9}
    def dt(self,value):return datetime.fromisoformat(value)
    def test_latest_due_only_after_sleep(self):
        now=self.dt('2026-10-20T18:30:00+08:00')
        slots=s.due_slots(self.schedule,now,now-timedelta(days=3))
        self.assertEqual([x['at'] for x in slots],['2026-10-20T18:00:00+08:00'])
    def test_no_backfill_before_activation(self):
        now=self.dt('2026-10-20T09:50:00+08:00')
        self.assertEqual(s.due_slots(self.schedule,now,now),[])
    def test_pause_is_noop(self):
        now=self.dt('2026-10-20T12:00:00+08:00')
        self.assertEqual(s.due_slots({**self.schedule,'enabled':False},now,now-timedelta(days=1)),[])
    def test_weekly_report_and_growth_both_retained(self):
        now=self.dt('2026-10-22T10:10:00+08:00')
        self.assertEqual([x['role'] for x in s.due_slots(self.schedule,now,now-timedelta(hours=10))],['report','growth'])
    def test_changed_hours_take_effect(self):
        now=self.dt('2026-10-20T11:00:00+08:00')
        self.assertEqual(s.due_slots({**self.schedule,'growth_hours':[11]},now,now-timedelta(minutes=10))[0]['at'],now.isoformat())
    def test_skips_nonexistent_dst_hour(self):
        schedule={**self.schedule,'timezone':'America/New_York','growth_hours':[2]}
        now=self.dt('2026-03-08T04:00:00-04:00')
        self.assertEqual(s.due_slots(schedule,now,now-timedelta(hours=4)),[])
    def test_native_controller_verification_and_duplicate_detection(self):
        with tempfile.TemporaryDirectory() as tmp:
            home=Path(tmp);setup=Setup(home/'install',home/'config.json')
            config={'growth':{'state_dir':str(home/'state'),'schedule':self.schedule}}
            n.save(setup.config_path,config);request=setup.schedule_request(config)
            path=home/'codex/automations/controller/automation.toml';path.parent.mkdir(parents=True)
            source='id="controller"\nkind="heartbeat"\nstatus="ACTIVE"\ntarget_thread_id="fixture"\nrrule='+json.dumps(request['controller']['rrule'])+'\nprompt='+json.dumps(request['controller']['prompt'])
            path.write_text(source)
            result=setup.verify_schedules([path],home/'codex');self.assertEqual(result['mode'],'controller')
            config['growth']['schedule']={**self.schedule,'growth_hours':[11],'enabled':False};n.save(setup.config_path,config)
            result=setup.verify_schedules([path],home/'codex');self.assertFalse(result['active']);self.assertTrue(result['registered'])
            other=path.parent.parent/'duplicate/automation.toml';other.parent.mkdir();other.write_text(source.replace('id="controller"','id="duplicate"'))
            with self.assertRaisesRegex(n.Error,'其他活动任务'):setup.verify_schedules([path],home/'codex')
    def test_tick_dedupes_completed_slot_and_retries_failed_slot(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);now=self.dt('2026-10-20T10:00:00+08:00')
            config={'growth':{'state_dir':str(root/'state'),'schedule':self.schedule,'switches':{'reports':True}}}
            n.save(root/'config.json',config)
            receipt={'mode':'controller','automation_ids':['test'],'activated_at':(now-timedelta(minutes=10)).isoformat()}
            n.save(root/'state/scheduler.json',receipt)
            with patch('setup.Setup.verify_schedules',return_value=receipt),patch('scheduler.flow.grow',side_effect=[n.Error('temporary'),{'verified':True}]) as grow:
                self.assertEqual(s.tick(root/'config.json',now=now)['status'],'failed')
                self.assertEqual(s.tick(root/'config.json',now=now)['status'],'processed')
                self.assertEqual(s.tick(root/'config.json',now=now)['status'],'idle')
                self.assertEqual(grow.call_count,2)

if __name__=='__main__':unittest.main()
