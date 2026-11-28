#!/usr/bin/env python3
"""离线检查解析逻辑。不访问网络。"""

import unittest
from pathlib import Path

import xhs_dl

FIXTURES = Path(__file__).resolve().parent / "fixtures"
SHARE = "https://xhslink.cn/o/A8vpzl1B6NG 存好口令，直达【小红书】瞅瞅~"


class ParseTests(unittest.TestCase):
    def test_extract_share_text(self):
        self.assertEqual(xhs_dl.extract_url(SHARE), "https://xhslink.cn/o/A8vpzl1B6NG")

    def test_extract_stops_at_chinese_punctuation(self):
        self.assertEqual(
            xhs_dl.extract_url("https://xhslink.cn/o/Abcd，存好口令"),
            "https://xhslink.cn/o/Abcd",
        )

    def test_reject_lookalike_host(self):
        with self.assertRaises(xhs_dl.UserError):
            xhs_dl.extract_url("https://xhslink.cn.evil.example/o/abc")
        with self.assertRaises(xhs_dl.UserError):
            xhs_dl.extract_url("https://evil.example/redirect?u=https://xhslink.cn/o/abc")

    def test_reject_ip(self):
        self.assertFalse(xhs_dl.host_allowed("127.0.0.1", xhs_dl.PAGE_SUFFIXES))
        self.assertFalse(xhs_dl.host_allowed("169.254.169.254", xhs_dl.FILE_SUFFIXES))
        self.assertTrue(xhs_dl.host_allowed("sns-video-bd.xhscdn.com", xhs_dl.FILE_SUFFIXES))
        self.assertTrue(xhs_dl.host_allowed("www.rednote.com", xhs_dl.PAGE_SUFFIXES))

    def test_classic_state_keeps_undefined_inside_strings(self):
        html = (FIXTURES / "classic.html").read_text(encoding="utf-8")
        state = xhs_dl.parse_initial_state(html)
        self.assertIsNone(state["unused"])
        note = xhs_dl.note_from_state(state)
        self.assertIn("undefined", note["desc"])
        self.assertIsNone(note["user"]["avatar"])
        self.assertEqual(xhs_dl.author_of(note), "测试作者")
        self.assertEqual(xhs_dl.origin_key(note), "pre_post/1040g2t0testkey")
        self.assertEqual(xhs_dl.image_urls(note), ["https://sns-img.xhscdn.com/test.jpg"])
        streams = xhs_dl.stream_urls(note)
        self.assertEqual(streams[0], "https://sns-video-hw.xhscdn.com/stream/test.mp4")
        self.assertEqual(streams[1], "https://sns-video-bd.xhscdn.com/stream/backup.mp4")
        self.assertEqual(xhs_dl.build_filename("测试作者", "测试标题", "mp4"), "测试作者_测试标题.mp4")

    def test_rednote_shape(self):
        html = (FIXTURES / "rednote.html").read_text(encoding="utf-8")
        state = xhs_dl.parse_initial_state(html)
        self.assertEqual(state["global"]["label"], "keep undefined word")
        self.assertIsNone(state["global"]["playLaunch"])
        note = xhs_dl.note_from_state(state)
        self.assertEqual(note["noteId"], "abc123")
        self.assertEqual(xhs_dl.author_of(note), "萌小萌")
        self.assertEqual(xhs_dl.display_title(note), "白色裤子 喇叭裤")
        self.assertEqual(xhs_dl.origin_key(note), "pre_post/1040g2t0sample")
        self.assertTrue(xhs_dl.build_filename(xhs_dl.author_of(note), xhs_dl.display_title(note), "mov").startswith("萌小萌_白色裤子_喇叭裤"))

    def test_image_note(self):
        html = (FIXTURES / "image_note.html").read_text(encoding="utf-8")
        note = xhs_dl.note_from_state(xhs_dl.parse_initial_state(html))
        self.assertEqual(xhs_dl.origin_key(note), "")
        self.assertEqual(
            xhs_dl.image_urls(note),
            ["https://sns-img.xhscdn.com/1.jpg", "https://sns-img.xhscdn.com/2.webp"],
        )
        self.assertEqual(xhs_dl.display_title(note), "风景")


if __name__ == "__main__":
    unittest.main()
