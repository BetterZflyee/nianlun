import copy
import unittest
from datetime import datetime, timedelta, timezone

import intake
import nianlun as n


class MailGateway:
    def __init__(self):
        self.calls=[]
        self.accounts={'emailAccounts':[{'email':'me@example.test'}]}
        self.search={'messages':[{'messageId':'m1'}],'meta':{'pagination':{'endpoint_exhausted':True}}}
        self.detail={'value':{'id':'m1','markdownBody':'项目有新进展','bodyHasMore':False}}

    def call(self,args):
        self.calls.append(args)
        if args[:3]==['mail','mailbox','list']:return copy.deepcopy(self.accounts)
        if args[:2]==['mail','+search-mail']:return copy.deepcopy(self.search)
        if args[:2]==['mail','+message']:return copy.deepcopy(self.detail)
        raise AssertionError('Unexpected operation')


class MailTests(unittest.TestCase):
    def setUp(self):
        self.gw=MailGateway()
        self.end=datetime(2026,10,24,tzinfo=timezone.utc)
        self.start=self.end-timedelta(days=1)

    def test_missing_list_is_not_an_empty_mailbox(self):
        self.gw.accounts={}
        with self.assertRaisesRegex(n.Error,'未完整返回'):intake.mailboxes(self.gw)
        self.gw.accounts={'emailAccounts':[]}
        self.assertEqual(intake.mailboxes(self.gw),[])

    def test_missing_or_other_mailbox_cannot_query(self):
        for email in ('','other@example.test'):
            with self.assertRaises(n.Error):intake.mail_probe(self.gw,email,self.start,self.end)
        self.assertTrue(all(a[:3]==['mail','mailbox','list'] for a in self.gw.calls))

    def test_probe_reads_one_body_and_returns_no_mail_content(self):
        phases=[]
        result=intake.mail_probe(self.gw,'me@example.test',self.start,self.end,phases.append)
        self.assertTrue(result['body_readable'])
        self.assertEqual(len(phases),3)
        self.assertEqual(self.gw.calls[-1],['mail','+message','--email','me@example.test','--id','m1'])
        self.assertEqual(self.gw.calls[-2][-2:],['--size','1'])
        self.assertNotIn('项目有新进展',str(result))
        self.assertNotIn('m1',str(result))

    def test_empty_search_is_not_claimed_as_body_success(self):
        self.gw.search['messages']=[]
        result=intake.mail_probe(self.gw,'me@example.test',self.start,self.end)
        self.assertTrue(result['list_readable']);self.assertIsNone(result['body_readable'])
        self.assertEqual(len(self.gw.calls),2)
        self.gw.search.pop('meta')
        with self.assertRaisesRegex(n.Error,'未确认结束'):intake.mail_probe(self.gw,'me@example.test',self.start,self.end)

    def test_wrong_identity_missing_and_partial_body_fail(self):
        for value in ({'id':'different','markdownBody':'text'},
                      {'id':'m1'}, {'id':'m1','markdownBody':'partial','bodyHasMore':True}):
            self.gw.detail={'value':value}
            with self.assertRaises(n.Error):intake.mail_probe(self.gw,'me@example.test',self.start,self.end)

    def test_body_failure_is_not_swallowed(self):
        original=self.gw.call
        def call(args):
            if args[:2]==['mail','+message']:raise n.Error('邮件服务暂时不可用')
            return original(args)
        self.gw.call=call
        with self.assertRaisesRegex(n.Error,'邮件服务暂时不可用'):
            intake.mail_probe(self.gw,'me@example.test',self.start,self.end)


if __name__=='__main__':unittest.main()
