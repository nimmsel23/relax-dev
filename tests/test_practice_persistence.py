import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import BackgroundTasks, HTTPException

import server


class PracticePersistenceTest(unittest.TestCase):
    def test_confirmed_unit_survives_read_and_subsequent_session_save(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(server, 'DATA_DIR', Path(directory)):
            (Path(directory) / 'sessions').mkdir()
            day = '2026-11-03'
            items = [
                {'id': 'confirmed', 'technique': 'PMR', 'trainingUnit': True, 'signed': True},
                {'id': 'ordinary', 'technique': 'Atmung'},
                {'id': 'unconfirmed', 'technique': 'Yoga', 'trainingUnit': True, 'signed': 'true'},
            ]
            server.save_session(BackgroundTasks(), {'items': items}, day)
            saved = server.get_session(day)['data']['items']
            self.assertIs(saved[0]['trainingUnit'], True)
            self.assertIs(saved[0]['signed'], True)
            self.assertIs(saved[1]['trainingUnit'], False)
            self.assertIs(saved[1]['signed'], False)
            self.assertIs(saved[2]['signed'], False)

            server.save_session(BackgroundTasks(), {'items': saved}, day)
            again = server.get_session(day)['data']['items']
            self.assertIs(again[0]['trainingUnit'], True)
            self.assertIs(again[0]['signed'], True)

    def test_corrupt_session_is_not_reported_as_missing(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(server, 'DATA_DIR', Path(directory)):
            sessions = Path(directory) / 'sessions'
            sessions.mkdir()
            (sessions / '2026-11-03.json').write_text('{broken', encoding='utf-8')
            with self.assertRaises(HTTPException) as error:
                server.get_session('2026-11-03')
            self.assertEqual(error.exception.status_code, 500)

    def test_write_failure_is_not_reported_as_success(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(server, 'DATA_DIR', Path(directory)):
            server.save_session(BackgroundTasks(), {'items': [{'technique': 'PMR'}]}, '2026-11-03')
            with patch.object(server.os, 'replace', side_effect=OSError('disk error')):
                with self.assertRaisesRegex(OSError, 'disk error'):
                    server.save_session(BackgroundTasks(), {'items': []}, '2026-11-03')
            self.assertEqual(server.get_session('2026-11-03')['data']['items'][0]['technique'], 'PMR')
            self.assertEqual(list((Path(directory) / 'sessions').glob('.session-*')), [])


if __name__ == '__main__':
    unittest.main()
