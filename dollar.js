// NOTE: This is not 100% original file.

/**
 * The $1 Unistroke Recognizer (JavaScript version)
 *
 *  Jacob O. Wobbrock, Ph.D.
 *  The Information School
 *  University of Washington
 *  Seattle, WA 98195-2840
 *  wobbrock@uw.edu
 *
 *  Andrew D. Wilson, Ph.D.
 *  Microsoft Research
 *  One Microsoft Way
 *  Redmond, WA 98052
 *  awilson@microsoft.com
 *
 *  Yang Li, Ph.D.
 *  Department of Computer Science and Engineering
 *  University of Washington
 *  Seattle, WA 98195-2840
 *  yangli@cs.washington.edu
 *
 * The academic publication for the $1 recognizer, and what should be
 * used to cite it, is:
 *
 *     Wobbrock, J.O., Wilson, A.D. and Li, Y. (2007). Gestures without
 *     libraries, toolkits or training: A $1 recognizer for user interface
 *     prototypes. Proceedings of the ACM Symposium on User Interface
 *     Software and Technology (UIST '07). Newport, Rhode Island (October
 *     7-10, 2007). New York: ACM Press, pp. 159-168.
 *     https://dl.acm.org/citation.cfm?id=1294238
 *
 * The Protractor enhancement was separately published by Yang Li and programmed
 * here by Jacob O. Wobbrock:
 *
 *     Li, Y. (2010). Protractor: A fast and accurate gesture
 *     recognizer. Proceedings of the ACM Conference on Human
 *     Factors in Computing Systems (CHI '10). Atlanta, Georgia
 *     (April 10-15, 2010). New York: ACM Press, pp. 2169-2172.
 *     https://dl.acm.org/citation.cfm?id=1753654
 *
 * This software is distributed under the "New BSD License" agreement:
 *
 * Copyright (C) 2007-2012, Jacob O. Wobbrock, Andrew D. Wilson and Yang Li.
 * All rights reserved. Last updated July 14, 2018.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the names of the University of Washington nor Microsoft,
 *      nor the names of its contributors may be used to endorse or promote
 *      products derived from this software without specific prior written
 *      permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Jacob O. Wobbrock OR Andrew D. Wilson
 * OR Yang Li BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
 * OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**/
//
// Point class
//
function Point(x, y) // constructor
{
	this.X = x;
	this.Y = y;
}
//
// Rectangle class
//
function Rectangle(x, y, width, height) // constructor
{
	this.X = x;
	this.Y = y;
	this.Width = width;
	this.Height = height;
}
//
// Unistroke class: a unistroke template
//
function Unistroke(name, points) // constructor
{
	this.Name = name;
	this.OriginalPoints = points.map(function(p){ return new Point(p.X, p.Y); });
	var working = points.map(function(p){ return new Point(p.X, p.Y); });
	this.Points = Resample(working, NumPoints);
	var radians = IndicativeAngle(this.Points);
	this.Points = RotateBy(this.Points, -radians);
	this.Points = ScaleTo(this.Points, SquareSize);
	this.Points = TranslateTo(this.Points, Origin);
	this.Vector = Vectorize(this.Points); // for Protractor
}
//
// Result class
//
function Result(name, score, ms) // constructor
{
	this.Name = name;
	this.Score = score;
	this.Time = ms;
}
//
// DollarRecognizer constants
//
const NumUnistrokes = 16;
const NumPoints = 64;
const SquareSize = 250.0;
const Origin = new Point(0,0);
const Diagonal = Math.sqrt(SquareSize * SquareSize + SquareSize * SquareSize);
const HalfDiagonal = 0.5 * Diagonal;
const AngleRange = Deg2Rad(45.0);
const AnglePrecision = Deg2Rad(2.0);
const Phi = 0.5 * (-1.0 + Math.sqrt(5.0)); // Golden Ratio
//
// DollarRecognizer class
//
function DollarRecognizer() // constructor
{
	//
	// one built-in unistroke per gesture type
	//
	this.Unistrokes = [];
	// Magic touch
	this.Unistrokes.push(new Unistroke("Z", new Array(new Point(67, 89),new Point(86, 88),new Point(106, 86),new Point(126, 84),new Point(146, 81),new Point(166, 80),new Point(186, 80),new Point(206, 80),new Point(226, 80),new Point(221, 87),new Point(204, 98),new Point(188, 109),new Point(171, 120),new Point(155, 131),new Point(139, 143),new Point(124, 156),new Point(108, 169),new Point(94, 183),new Point(81, 198),new Point(92, 204),new Point(112, 206),new Point(132, 208),new Point(152, 208),new Point(172, 208),new Point(192, 208),new Point(212, 208),new Point(232, 208),new Point(244, 210))));
	this.Unistrokes.push(new Unistroke("Loop", new Array(new Point(92, 69),new Point(107, 81),new Point(121, 95),new Point(133, 111),new Point(143, 128),new Point(155, 144),new Point(163, 163),new Point(169, 182),new Point(172, 201),new Point(164, 218),new Point(145, 221),new Point(126, 217),new Point(110, 206),new Point(101, 188),new Point(100, 168),new Point(106, 150),new Point(117, 133),new Point(130, 118),new Point(143, 103),new Point(156, 88),new Point(171, 75),new Point(187, 63),new Point(196, 58))));
	this.Unistrokes.push(new Unistroke("Caret", new Array(new Point(73, 252),new Point(80, 234),new Point(89, 216),new Point(97, 198),new Point(104, 179),new Point(111, 160),new Point(117, 141),new Point(122, 122),new Point(128, 103),new Point(135, 84),new Point(142, 65),new Point(150, 47),new Point(152, 60),new Point(155, 80),new Point(159, 99),new Point(163, 119),new Point(168, 138),new Point(174, 157),new Point(179, 177),new Point(182, 196),new Point(184, 216),new Point(185, 236),new Point(190, 255),new Point(192, 259))));
	this.Unistrokes.push(new Unistroke("Vase", new Array(new Point(132, 74),new Point(112, 76),new Point(94, 83),new Point(83, 99),new Point(78, 118),new Point(76, 138),new Point(77, 158),new Point(85, 176),new Point(95, 193),new Point(106, 210),new Point(121, 223),new Point(138, 230),new Point(158, 232),new Point(176, 225),new Point(195, 218),new Point(211, 206),new Point(221, 189),new Point(226, 169),new Point(226, 149),new Point(225, 130),new Point(221, 110),new Point(215, 91),new Point(201, 78),new Point(186, 71),new Point(185, 71))));
	this.Unistrokes.push(new Unistroke("VVV", new Array(new Point(30, 112),new Point(37, 130),new Point(46, 148),new Point(55, 166),new Point(65, 183),new Point(70, 202),new Point(80, 203),new Point(89, 185),new Point(97, 167),new Point(104, 149),new Point(110, 130),new Point(118, 120),new Point(124, 139),new Point(129, 159),new Point(134, 178),new Point(139, 197),new Point(142, 216),new Point(150, 206),new Point(157, 187),new Point(163, 168),new Point(168, 149),new Point(175, 130),new Point(180, 112),new Point(186, 129),new Point(189, 148),new Point(193, 168),new Point(198, 187),new Point(205, 206),new Point(213, 223),new Point(220, 205),new Point(226, 186),new Point(234, 167),new Point(241, 148),new Point(247, 130),new Point(253, 111),new Point(255, 103))));
	this.Unistrokes.push(new Unistroke("H", new Array(new Point(87, 252),new Point(92, 233),new Point(94, 213),new Point(96, 193),new Point(96, 173),new Point(96, 153),new Point(97, 133),new Point(98, 114),new Point(99, 94),new Point(96, 74),new Point(85, 58),new Point(69, 52),new Point(54, 65),new Point(43, 81),new Point(41, 100),new Point(53, 115),new Point(70, 125),new Point(90, 127),new Point(110, 127),new Point(130, 127),new Point(150, 127),new Point(170, 129),new Point(190, 130),new Point(209, 129),new Point(229, 127),new Point(248, 124),new Point(267, 116),new Point(279, 101),new Point(284, 82),new Point(283, 63),new Point(268, 50),new Point(251, 48),new Point(240, 65),new Point(235, 84),new Point(234, 104),new Point(234, 124),new Point(235, 144),new Point(235, 164),new Point(234, 183),new Point(233, 203),new Point(232, 223),new Point(231, 243),new Point(231, 263),new Point(232, 265))));
	
	// Symbols from Divineko
	this.Unistrokes.push(new Unistroke("Square", new Array(new Point(86, 87),new Point(86, 107),new Point(86, 127),new Point(85, 147),new Point(85, 167),new Point(85, 187),new Point(99, 192),new Point(119, 192),new Point(139, 192),new Point(159, 192),new Point(179, 194),new Point(199, 194),new Point(205, 176),new Point(208, 157),new Point(210, 137),new Point(210, 117),new Point(210, 97),new Point(207, 80),new Point(187, 81),new Point(168, 84),new Point(148, 84),new Point(128, 84),new Point(109, 83),new Point(89, 83),new Point(84, 83))));
	this.Unistrokes.push(new Unistroke("W", new Array(new Point(49, 82),new Point(51, 102),new Point(57, 121),new Point(63, 140),new Point(69, 159),new Point(76, 177),new Point(84, 195),new Point(93, 192),new Point(105, 176),new Point(114, 158),new Point(122, 140),new Point(129, 121),new Point(136, 103),new Point(143, 97),new Point(148, 116),new Point(151, 136),new Point(156, 155),new Point(162, 174),new Point(170, 192),new Point(180, 196),new Point(189, 178),new Point(197, 160),new Point(202, 141),new Point(207, 122),new Point(215, 104),new Point(223, 86),new Point(226, 80))));
	this.Unistrokes.push(new Unistroke("SmallE", new Array(new Point(113, 166),new Point(132, 167),new Point(152, 164),new Point(168, 152),new Point(181, 137),new Point(189, 119),new Point(181, 103),new Point(162, 97),new Point(142, 94),new Point(122, 95),new Point(102, 98),new Point(85, 109),new Point(72, 124),new Point(64, 141),new Point(61, 161),new Point(68, 180),new Point(80, 195),new Point(96, 208),new Point(113, 217),new Point(133, 222),new Point(152, 223),new Point(172, 223),new Point(192, 220),new Point(211, 214),new Point(229, 205),new Point(244, 192))));
	this.Unistrokes.push(new Unistroke("Circle", new Array(new Point(148, 81),new Point(129, 82),new Point(113, 92),new Point(99, 106),new Point(92, 124),new Point(91, 144),new Point(93, 163),new Point(104, 180),new Point(122, 188),new Point(141, 194),new Point(160, 196),new Point(179, 191),new Point(195, 178),new Point(207, 163),new Point(215, 145),new Point(218, 125),new Point(211, 107),new Point(199, 91),new Point(185, 77),new Point(168, 71),new Point(155, 73))));
	this.Unistrokes.push(new Unistroke("Lightning", new Array(new Point(58, 171),new Point(67, 188),new Point(77, 205),new Point(86, 223),new Point(96, 240),new Point(106, 247),new Point(109, 227),new Point(113, 208),new Point(116, 188),new Point(116, 168),new Point(116, 148),new Point(116, 128),new Point(116, 108),new Point(117, 88),new Point(119, 68),new Point(128, 62),new Point(142, 77),new Point(155, 92),new Point(164, 109),new Point(174, 127),new Point(176, 130))));
	this.Unistrokes.push(new Unistroke("Fish", new Array(new Point(71, 69),new Point(82, 85),new Point(94, 101),new Point(107, 116),new Point(122, 129),new Point(136, 143),new Point(151, 157),new Point(164, 172),new Point(177, 187),new Point(187, 185),new Point(190, 166),new Point(194, 146),new Point(196, 126),new Point(197, 106),new Point(198, 87),new Point(198, 67),new Point(193, 66),new Point(181, 82),new Point(167, 97),new Point(153, 111),new Point(137, 123),new Point(121, 134),new Point(105, 145),new Point(89, 157),new Point(74, 169),new Point(58, 179),new Point(54, 182))));

	// Other
	this.Unistrokes.push(new Unistroke("Vortex", new Array(new Point(150, 147), new Point(169, 140), new Point(183, 126), new Point(181, 107), new Point(164, 98), new Point(145, 102), new Point(131, 117), new Point(121, 134), new Point(119, 153), new Point(128, 170), new Point(147, 177), new Point(166, 177), new Point(185, 169), new Point(199, 155), new Point(210, 138), new Point(216, 120), new Point(217, 100), new Point(213, 80), new Point(202, 65), new Point(184, 57), new Point(165, 52), new Point(145, 51), new Point(125, 54), new Point(107, 61), new Point(89, 71), new Point(74, 84), new Point(63, 100), new Point(58, 119), new Point(56, 139), new Point(59, 159), new Point(67, 177), new Point(75, 195), new Point(87, 210), new Point(105, 219), new Point(124, 223), new Point(144, 225), new Point(164, 222), new Point(183, 215), new Point(200, 206), new Point(211, 200))));
	
	//
	// The $1 Gesture Recognizer API begins here -- 3 methods: Recognize(), AddGesture(), and DeleteUserGestures()
	//
	this.Recognize = function(points, useProtractor)
	{
		var t0 = Date.now();
		var candidate = new Unistroke("", points);

		var u = -1;
		var b = +Infinity;
		for (var i = 0; i < this.Unistrokes.length; i++) // for each unistroke template
		{
			var d;
			if (useProtractor)
				d = OptimalCosineDistance(this.Unistrokes[i].Vector, candidate.Vector); // Protractor
			else
				d = DistanceAtBestAngle(candidate.Points, this.Unistrokes[i], -AngleRange, +AngleRange, AnglePrecision); // Golden Section Search (original $1)
			if (d < b) {
				b = d; // best (least) distance
				u = i; // unistroke index
			}
		}
		var t1 = Date.now();
		return (u == -1) ? new Result("No match.", 0.0, t1-t0) : new Result(this.Unistrokes[u].Name, useProtractor ? (1.0 - b) : (1.0 - b / HalfDiagonal), t1-t0);
	}
	this.AddGesture = function(name, points)
	{
		this.Unistrokes[this.Unistrokes.length] = new Unistroke(name, points); // append new unistroke
		var num = 0;
		for (var i = 0; i < this.Unistrokes.length; i++) {
			if (this.Unistrokes[i].Name == name)
				num++;
		}
		return num;
	}
	this.DeleteUserGestures = function()
	{
		this.Unistrokes.length = NumUnistrokes; // clear any beyond the original set
		return NumUnistrokes;
	}
}
//
// Private helper functions from here on down
//
function Resample(points, n)
{
	var I = PathLength(points) / (n - 1); // interval length
	var D = 0.0;
	var newpoints = new Array(points[0]);
	for (var i = 1; i < points.length; i++)
	{
		var d = Distance(points[i-1], points[i]);
		if ((D + d) >= I)
		{
			var qx = points[i-1].X + ((I - D) / d) * (points[i].X - points[i-1].X);
			var qy = points[i-1].Y + ((I - D) / d) * (points[i].Y - points[i-1].Y);
			var q = new Point(qx, qy);
			newpoints[newpoints.length] = q; // append new point 'q'
			points.splice(i, 0, q); // insert 'q' at position i in points s.t. 'q' will be the next i
			D = 0.0;
		}
		else D += d;
	}
	if (newpoints.length == n - 1) // somtimes we fall a rounding-error short of adding the last point, so add it if so
		newpoints[newpoints.length] = new Point(points[points.length - 1].X, points[points.length - 1].Y);
	return newpoints;
}
function IndicativeAngle(points)
{
	var c = Centroid(points);
	return Math.atan2(c.Y - points[0].Y, c.X - points[0].X);
}
function RotateBy(points, radians) // rotates points around centroid
{
	var c = Centroid(points);
	var cos = Math.cos(radians);
	var sin = Math.sin(radians);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = (points[i].X - c.X) * cos - (points[i].Y - c.Y) * sin + c.X
		var qy = (points[i].X - c.X) * sin + (points[i].Y - c.Y) * cos + c.Y;
		newpoints[newpoints.length] = new Point(qx, qy);
	}
	return newpoints;
}
function ScaleTo(points, size) // non-uniform scale; assumes 2D gestures (i.e., no lines)
{
	var B = BoundingBox(points);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = points[i].X * (size / B.Width);
		var qy = points[i].Y * (size / B.Height);
		newpoints[newpoints.length] = new Point(qx, qy);
	}
	return newpoints;
}
function TranslateTo(points, pt) // translates points' centroid
{
	var c = Centroid(points);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = points[i].X + pt.X - c.X;
		var qy = points[i].Y + pt.Y - c.Y;
		newpoints[newpoints.length] = new Point(qx, qy);
	}
	return newpoints;
}
function Vectorize(points) // for Protractor
{
	var sum = 0.0;
	var vector = new Array();
	for (var i = 0; i < points.length; i++) {
		vector[vector.length] = points[i].X;
		vector[vector.length] = points[i].Y;
		sum += points[i].X * points[i].X + points[i].Y * points[i].Y;
	}
	var magnitude = Math.sqrt(sum);
	for (var i = 0; i < vector.length; i++)
		vector[i] /= magnitude;
	return vector;
}
function OptimalCosineDistance(v1, v2) // for Protractor
{
	var a = 0.0;
	var b = 0.0;
	for (var i = 0; i < v1.length; i += 2) {
		a += v1[i] * v2[i] + v1[i+1] * v2[i+1];
		b += v1[i] * v2[i+1] - v1[i+1] * v2[i];
	}
	var angle = Math.atan(b / a);
	return Math.acos(a * Math.cos(angle) + b * Math.sin(angle));
}
function DistanceAtBestAngle(points, T, a, b, threshold)
{
	var x1 = Phi * a + (1.0 - Phi) * b;
	var f1 = DistanceAtAngle(points, T, x1);
	var x2 = (1.0 - Phi) * a + Phi * b;
	var f2 = DistanceAtAngle(points, T, x2);
	while (Math.abs(b - a) > threshold)
	{
		if (f1 < f2) {
			b = x2;
			x2 = x1;
			f2 = f1;
			x1 = Phi * a + (1.0 - Phi) * b;
			f1 = DistanceAtAngle(points, T, x1);
		} else {
			a = x1;
			x1 = x2;
			f1 = f2;
			x2 = (1.0 - Phi) * a + Phi * b;
			f2 = DistanceAtAngle(points, T, x2);
		}
	}
	return Math.min(f1, f2);
}
function DistanceAtAngle(points, T, radians)
{
	var newpoints = RotateBy(points, radians);
	return PathDistance(newpoints, T.Points);
}
function Centroid(points)
{
	var x = 0.0, y = 0.0;
	for (var i = 0; i < points.length; i++) {
		x += points[i].X;
		y += points[i].Y;
	}
	x /= points.length;
	y /= points.length;
	return new Point(x, y);
}
function BoundingBox(points)
{
	var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
	for (var i = 0; i < points.length; i++) {
		minX = Math.min(minX, points[i].X);
		minY = Math.min(minY, points[i].Y);
		maxX = Math.max(maxX, points[i].X);
		maxY = Math.max(maxY, points[i].Y);
	}
	return new Rectangle(minX, minY, maxX - minX, maxY - minY);
}
function PathDistance(pts1, pts2)
{
	var d = 0.0;
	for (var i = 0; i < pts1.length; i++) // assumes pts1.length == pts2.length
		d += Distance(pts1[i], pts2[i]);
	return d / pts1.length;
}
function PathLength(points)
{
	var d = 0.0;
	for (var i = 1; i < points.length; i++)
		d += Distance(points[i - 1], points[i]);
	return d;
}
function Distance(p1, p2)
{
	var dx = p2.X - p1.X;
	var dy = p2.Y - p1.Y;
	return Math.sqrt(dx * dx + dy * dy);
}
function Deg2Rad(d) { return (d * Math.PI / 180.0); }