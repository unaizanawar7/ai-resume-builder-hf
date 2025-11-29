% SixtySecondsCV LaTeX class
% Copyright © 2020 L. Gueroult <lgueroult-at-hotmail.com>
% Licensed under the 3-Clause BSD License. See LICENSE file for details.
%
% Please visit https://github.com/LaGuer/SixtySecondsCV for the most
% recent version! For bugs or feature requests, please open a new issue on
% github.
%
% Contributors
% ------------
% * ifokkema
% * Bertbk
% * Hespe
% * esben
%
% Attributions
% ------------
% * SixtySecondsCV LaTeX class is based on fortysecondscv class by
%   René Wirnata <rene.wirnata@pandascience.net>,
%   released under the 3-Clause BSD License and available under
%   https://github.com/PandaScience/FortySecondsCV
% * FortySecondsCV LaTeX class is based on twentysecondcv class by Carmine Spagnuolo
%   (cspagnuolo@unisa.it), released under the MIT license and available under
%   https://github.com/spagnuolocarmine/TwentySecondsCurriculumVitae-LaTex

% Licensed under the 3-Clause BSD License. See LICENSE file for details.
% * further attributions are indicated immediately before corresponding code
%-------------------------------------------------------------------------------
%                           CLASS NAME AND VERSION
%-------------------------------------------------------------------------------
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{sixtysecondscv}[2020/06/09 CV class]


%-------------------------------------------------------------------------------
%                            PROCESS CLASS OPTIONS
%-------------------------------------------------------------------------------
%% load some required packages first
% for easy color definitions; provides \definecolor; load before background pkg
\RequirePackage[dvipsnames, svgnames, x11names]{xcolor}
% for positioning text within the side column | use showboxes for visible frame
\RequirePackage[absolute,overlay]{textpos}
% provides key-value class options via \DeclareOptionX
\RequirePackage{xkeyval}
% provides \ifnumgreater{<int expr.>}{<int expr.>}{<true>}{<false>},
% \apptocmd{<command>}{<code>}{<success>}{<failure>} and \newtoggle{<n>}
\RequirePackage{etoolbox}
% enable simple math like +/- etc. on lengths
\RequirePackage{calc}
% change page margins
\RequirePackage[
	nohead,
	nofoot,
	nomarginpar,
]{geometry}

% pre-define some colors the user can choose from

\definecolor{white}{RGB}{255,255,255}
\definecolor{darkgray}{HTML}{333333}
\definecolor{gray}{HTML}{4D4D4D}
\definecolor{lightgray}{HTML}{999999}
\definecolor{green}{HTML}{C2E15F}
\definecolor{orange}{HTML}{FDA333}
\definecolor{purple}{HTML}{D3A4F9}
\definecolor{red}{HTML}{FB4485}
\definecolor{blue}{HTML}{6CE0F1}
\definecolor{materialpurple}{HTML}{9C27B0}
\definecolor{materialindigo}{HTML}{3F51B5}
\definecolor{materialblue}{HTML}{2196F3}
\definecolor{materialcyan}{HTML}{00BCD4}
\definecolor{materialteal}{HTML}{009688}
\definecolor{materialgreen}{HTML}{4CAF50}
\definecolor{materiallime}{HTML}{CDDC39}
\definecolor{materialamber}{HTML}{FFC107}
\definecolor{materialbrown}{HTML}{795548}
\definecolor{materialred}{HTML}{FF4436}
\definecolor{materialorange}{HTML}{FF5722}
\definecolor{cvblue}{HTML}{0E5484}
\definecolor{cvgreen}{HTML}{007170}
\definecolor{cvred}{HTML}{8B0000}
\definecolor{cvsidecolor}{HTML}{E7E7E7}
\definecolor{cvsectioncolor}{HTML}{0395DE}
\definecolor{cvsubsectioncolor}{HTML}{4D4D4D}
% set default values
\colorlet{maincolor}{cvblue}
\colorlet{sidecolor}{cvsidecolor}
\colorlet{sectioncolor}{cvsectioncolor}
\colorlet{subsectioncolor}{cvsubsectioncolor}
\colorlet{itemtextcolor}{black!90}
% colors for document body (right column)
% let user define main color
\DeclareOptionX{maincolor}{\colorlet{maincolor}{#1}}
\DeclareOptionX{sidecolor}{\colorlet{sidecolor}{#1}}
\DeclareOptionX{sectioncolor}{\colorlet{sectioncolor}{#1}}
\DeclareOptionX{subsectioncolor}{\colorlet{subsectioncolor}{#1}}
\DeclareOptionX{itemtextcolor}{\colorlet{itemtextcolor}{#1}}

% set page margins
\newlength\sidebarwidth%
\newlength\topbottommargin%
\newlength\leftrightmargin%
\newlength\sidebartextwidth
% default values
\setlength{\sidebarwidth}{0.34\paperwidth}
\setlength{\topbottommargin}{0.02\paperheight}
\setlength{\leftrightmargin}{0.02\paperwidth}
% user overwrites
\DeclareOptionX{sidebarwidth}{\setlength{\sidebarwidth}{#1}}
\DeclareOptionX{topbottommargin}{\setlength{\topbottommargin}{#1}}
\DeclareOptionX{leftrightmargin}{\setlength{\leftrightmargin}{#1}}

% profile picture settings
\newlength\profilepicsize%
\setlength{\profilepicsize}{0.7\sidebarwidth}
\DeclareOptionX{profilepicsize}{\setlength{\profilepicsize}{#1}}
\newlength\profilepicborderwidth%
\setlength{\profilepicborderwidth}{3.5pt}
\DeclareOptionX{profilepicborderwidth}{\setlength{\profilepicborderwidth}{#1}}
\newcommand*{\profilepicstyle}{}
\DeclareOptionX{profilepicstyle}{\renewcommand{\profilepicstyle}{#1}}
\newcommand*{\profilepiczoom}{}
\DeclareOptionX{profilepiczoom}{\renewcommand{\profilepiczoom}{#1}}
\newlength\profilepicxshift
\setlength{\profilepicxshift}{0mm}
\DeclareOptionX{profilepicxshift}{\setlength{\profilepicxshift}{#1}}
\newlength\profilepicyshift
\setlength{\profilepicyshift}{0mm}
\DeclareOptionX{profilepicyshift}{\setlength{\profilepicyshift}{#1}}
\newlength\profilepicrounding
\setlength{\profilepicrounding}{0.15\sidebarwidth}
\DeclareOptionX{profilepicrounding}{\setlength{\profilepicrounding}{#1}}

% logo settings
\newlength\logowidth%
\setlength{\logowidth}{\profilepicsize}
\DeclareOptionX{logowidth}{\setlength{\logowidth}{#1}}
\newlength\logospace%
\DeclareOptionX{logospace}{\setlength{\logospace}{#1}}
\newcommand*{\logoposition}{}
\DeclareOptionX{logoposition}{\renewcommand{\logoposition}{#1}}

% show sidebar and page margins
\newtoggle{tshowframes}
\togglefalse{tshowframes}
\DeclareOptionX{showframes}{
	\geometry{showframe}
	\TPoptions{showboxes=true}
	\toggletrue{tshowframes}
	% adding \hline in \newenvironment directly doesn't work, so do it here...
	\AtBeginDocument{\apptocmd{\personaldata}{\hline}{}{}}
}

% draw vertical guideline
\newcommand{\plotvline}{}
\DeclareOptionX{vline}{%
	% must be defined here as macro, b/c tikz won't expand absolute length in
	% \backgroundsetup -- BUG?
	\renewcommand{\plotvline}{%
		\draw [thick, red, opacity=0.7]
		(\leftrightmargin + #1, 0) -- (\leftrightmargin + #1, -\paperheight);
	}
}

% pass further options to base class and load it
\DeclareOptionX*{\PassOptionsToClass{\CurrentOption}{article}}
\ProcessOptionsX\relax
\LoadClass{article}

% compute "inner" margin of sidebar automatically;
% must come after \sidebarwidth and \leftrightmargin possibly changed by user
\setlength{\sidebartextwidth}{\sidebarwidth - 2\leftrightmargin}

% let geometry package perform the changes;
% must come after loading the base class to prevent overwriting
\geometry{
	top=\topbottommargin,
	bottom=\topbottommargin,
	left=\sidebarwidth + \leftrightmargin,
	right=\leftrightmargin,
}

%-------------------------------------------------------------------------------
%                              REQUIRED PACKAGES
%-------------------------------------------------------------------------------
% font configuration
%\RequirePackage[sfdefault]{ClearSans}

% use as workaround for spacing problem when TikZ picture is not in paragraph;
% details: https://tex.stackexchange.com/a/435790
\RequirePackage[texcoord]{eso-pic}

% for easy section style definitions
\RequirePackage{titlesec}

% loads graphicx, provides align=c option for vertical alignment w.r.t. text
\RequirePackage{graphbox}

% provides X column type for automatic length calculations
\RequirePackage{tabularx}

% take care of compiler-specific packages
\RequirePackage{ifluatex}
\RequirePackage{ifxetex}
\newif\ifxetexorluatex
\ifxetex
	\xetexorluatextrue
\else
	\ifluatex
		\xetexorluatextrue
	\else
		\xetexorluatexfalse
	\fi
\fi

% pictures, icons and drawings
\ifxetexorluatex
	%\RequirePackage{fontawesome5}
	\RequirePackage{fontawesome}
	\RequirePackage{academicons}
\else
	\RequirePackage{fontawesome}
\fi
\RequirePackage{tikz}
\usetikzlibrary{arrows, backgrounds}

% provides \xrfill for horizontal rules
\RequirePackage{xhfill}

% provides basic conditional expressions
\RequirePackage{ifthen}

% enable multiple optional arguments in macros
\RequirePackage{xparse}

% enable links
\RequirePackage[hidelinks]{hyperref}



%-------------------------------------------------------------------------------
%                          DERIVED COLOR DEFINITIONS
%-------------------------------------------------------------------------------
% profile section color (sidebar/left column)
\colorlet{pseccolor}{maincolor!90}
% color used for all icon arguments
\colorlet{iconcolor}{maincolor!90}

% color definitions for TikZ drawings
\colorlet{wheelchartlabelcolor}{black}
\colorlet{wheeltextcolor}{black!80}

%-------------------------------------------------------------------------------
%                      GLOBAL LAYOUT AND HEADINGS STYLE
%-------------------------------------------------------------------------------
% remove headers and footers
\pagestyle{empty}

% globally disable paragraph indentation
\setlength{\parindent}{0pt}

% set space between paragraphs
% \setlength{\parskip}{1ex}

% creates a rule after some text using remaining line width
% usage: \xrfill[<raise>]{<width>}
\newcommand*{\sectionline}[1]{#1~\xrfill[.5ex]{1pt}[pseccolor]} % \sectionline

%-------------------------------------------------------------------------------
%                            SIDEBAR CUSTOM MACROS
%-------------------------------------------------------------------------------
%% profile picture --> \cvprofilepic
\newcommand*{\cvprofilepic}[1]{\renewcommand{\cvprofilepic}{#1}}

%% logo picture --> \cvlogopic
\newcommand*{\cvlogopic}[1]{\renewcommand{\cvlogopic}{#1}}

%% name --> \cvname
\newcommand*{\cvname}[1]{\renewcommand{\cvname}{#1}}

%% job title --> \cvjobtitle
\newcommand*{\cvjobtitle}[1]{\renewcommand{\cvjobtitle}{#1}}

%% birthday --> \cvbirthday
\newcommand*{\cvbirthday}[1]{\renewcommand{\cvbirthday}{#1}}

%% address --> \cvaddress
\newcommand*{\cvaddress}[1]{\renewcommand{\cvaddress}{#1}}

%% phone number --> \cvphone
\newcommand*{\cvphone}[1]{\renewcommand{\cvphone}{#1}}

%% skype ID --> \cvskype
\newcommand*{\cvskype}[1]{\renewcommand{\cvskype}{#1}}

%% personal website --> \cvsite
\newcommand*{\cvsite}[1]{\renewcommand{\cvsite}{#1}}

%% email address --> \cvmail
\newcommand*{\cvmail}[1]{\renewcommand{\cvmail}{#1}}

%% pgp key --> \cvkey{<keysize>}{<keyid>}
% e.g. \cvkey{4096R/0x0123456789ABCDEF}{0x0123456789ABCDEF}
\newcommand*{\cvkey}[2]{\renewcommand{\cvkey}{#1}{#2}}

%% any other custom entry --> \cvcustomdata{<Icon>}{<text>}
\newcommand*{\cvcustomdata}[2]{\renewcommand{\cvcustomdata}{#1}{#2}}

\newcommand{\plotprofilepicture}{
	\ifthenelse{\equal{\cvprofilepic}{}}{}{
		\begin{tikzpicture}[remember picture, overlay]
			\node[
				anchor=north,
				inner sep=\profilepicborderwidth,
				outer sep=0pt,
			] (profilepic) at (\leftrightmargin+0.5\sidebartextwidth, -\topbottommargin) {
				\ifthenelse{\equal{\profilepicstyle}{profilecircle}}{
					\begin{tikzpicture}
						\node[
							circle,
							minimum size=\profilepicsize,
							path picture={
								\node at (path picture bounding box.center){
									\includegraphics[width=\profilepicsize]{\cvprofilepic}
								};
							}
						]{};
					\end{tikzpicture}
				}{
					% fallback if profilepicstyle is undefined
					\includegraphics[width=\profilepicsize]{\cvprofilepic}
				}
			};
		\end{tikzpicture}
	}
}

\newcommand{\plotlogobefore}{
	\ifthenelse{\equal{\logoposition}{before}}{
		\ifthenelse{\equal{\cvlogopic}{}}{}{
			\begin{figure}[!h]
				\centering
				\includegraphics[width=\logowidth]{\cvlogopic}
			\end{figure}
			\vspace{\logospace}
		}
	}{}
}

\newcommand{\plotlogoafter}{
	\ifthenelse{\equal{\logoposition}{after}}{
		\ifthenelse{\equal{\cvlogopic}{}}{}{
			\vspace{\logospace}
			\begin{figure}[!h]
				\centering
				\includegraphics[width=\logowidth]{\cvlogopic}
			\end{figure}
		}
	}{}
}

\newcommand{\nameandjob}{%
	{\Huge\color{maincolor}\textbf{\cvname}\par}
	\setlength{\parskip}{1ex}
	{\Large\color{black!80}\cvjobtitle\par}
	\setlength{\parskip}{1ex}
}

\newcommand{\personaldata}{%
	\ifthenelse{\equal{\cvbirthday}{}}{}{\personal{\faCalendar}{\cvbirthday}}
	\ifthenelse{\equal{\cvaddress}{}}{}{\personal{\faMapMarker}{\cvaddress}}
	\ifthenelse{\equal{\cvphone}{}}{}{\personal{\faMobile}{\cvphone}}
	\ifthenelse{\equal{\cvskype}{}}{}{\personal{\faSkype}{\cvskype}}
	\ifthenelse{\equal{\cvsite}{}}{}{\personal{\faGlobe}{\cvsite}}
	\ifthenelse{\equal{\cvmail}{}}{}{\personal{\faEnvelope}{\cvmail}}
	\ifthenelse{\equal{\cvkey}{}{}}{}{%
		\personal{\faKey}{\cvkey}
	}
	\ifthenelse{\equal{\cvcustomdata}{}{}}{}{%
		\cvcustomdata
	}
}

\newcommand{\aboutme}[1]{\def\@aboutme{#1}}

% table with 2 columns: icon and text
% usage: \begin{icontable}[<arraystretch>]{<iconwidth>}{<textwidth>}<content>\end{icontable}
\newenvironment{icontable}[3][1]{%
	\renewcommand{\arraystretch}{#1}
	\begin{tabular}{m{#2} @{\hskip 0.5em} b{#3}}%
}{%
	\end{tabular}%
}

\newcommand{\personal}[2]{\textcolor{iconcolor}{#1} & {#2} \\[0.4em]}

\newcommand{\social}[3]{%
	\textcolor{iconcolor}{#1} &
	\href{#2}{#3} \\[0.4em]%
}

\newcommand{\pointskill}[4][0]{%
	\textcolor{iconcolor}{#2} &
	\ifthenelse{#1 = 0}{%
		#3%
	}{%
		\foreach \x in {1,...,#1}{%
			\color{black!30}\faCircle
		}\setcounter{a}{#1}%
		\foreach \x in {1,...,#4}{%
			\addtocounter{a}{1}%
			\ifthenelse{\value{a} > 5}{}{%
				\space\color{iconcolor}\faCircle
			}%
		}%
	}
	\\[0.4em]
}

\newcommand{\barskill}[3]{
	\textcolor{iconcolor}{#1} &
	\begin{tikzpicture}[scale=1,rounded corners=0.5ex]
		\fill [black!30] (0,0) rectangle (5,0.15);
		\fill [iconcolor] (0,0) rectangle (#3/20,0.15);
		\node [above right] at (0,0.15) {#2};
	\end{tikzpicture}
	\\[0.4em]
}

\newcommand{\skill}[2][1em]{%
	\textcolor{iconcolor}{#2}\hspace*{#1}%
}

% enable show all 4 of the given icon arguments as flag icons
\newcommand{\flag}[1]{\raisebox{-0.15em}{\includegraphics[height=1em]{#1}}}

% \profilesection{<section title>}
\NewDocumentCommand{\profilesection}{m}{%
	{\color{pseccolor}\textbf{\large #1}}\\[0.1em]%
}

\newcommand{\chartlabel}[1]{
	\begin{tikzpicture}
		\node[
			rectangle,
			draw=pseccolor,
			anchor=base,
			rounded corners=0.5ex,
			minimum height=1.5ex,
			inner xsep=1ex, % distance from left/right border to text
			inner ysep=0.75ex, % distance top/bottom border to text
			text height=1.5ex, % align text vertically in box (at least as resulting
			text depth=.25ex   % effect)
		]{#1};%
		\end{tikzpicture}
}


\newenvironment{sidebarminipage}%
	{\begin{minipage}{\sidebartextwidth}}%
	{\end{minipage}}%


\newenvironment{memberships}[1][1em]%
{%
	\iftoggle{tshowframes}{%
		\tabularx{\sidebartextwidth}{|l | @{\hskip #1} | X|} \hline%
	}{%
		\tabularx{\sidebartextwidth}{l @{\hskip #1} X}%
	}
}{%
	\endtabularx%
}%


\newcommand{\membership}[3][4em]{
	\includegraphics[align=c,width=#1]{#2} & {#3} \\[3ex]
}

% adapted from https://tex.stackexchange.com/a/82729
\newcommand{\wheelchart}[4][-90]{%
	\def\outerradius{#2}%
	\def\innerradius{#3}%
	% Calculate total
	\pgfmathsetmacro{\totalnum}{0}%
	\foreach\value/\colour/\name in {#4} {%
		\pgfmathparse{\value+\totalnum}%
		\global\let\totalnum=\pgfmathresult%
	}%
	\begin{tikzpicture}

		% Calculate the thickness and the middle line of the wheel
		\pgfmathsetmacro{\wheelwidth}{\outerradius-\innerradius}
		\pgfmathsetmacro{\midradius}{(\outerradius+\innerradius)/2}

		% Rotate so we start from the top
		\begin{scope}[rotate=#1, on background layer]
		% Loop through each value set. \cumnum keeps track of where we are in the
		% wheel
		\pgfmathsetmacro{\cumnum}{0}
		\foreach \value/\width/\colour/\name in {#4} {
			\pgfmathsetmacro{\newcumnum}{\cumnum + \value/\totalnum*360}

			% Calculate the percent value
			\pgfmathsetmacro{\percentage}{\value/\totalnum*100}
			% Calculate the mid angle of the colour segments to place the labels
			\pgfmathsetmacro{\midangle}{-(\cumnum+\newcumnum)/2}

			% This is necessary for the labels to align nicely
			\pgfmathparse{
				(-\midangle>180?"west":"east")
			} \edef\textanchor{\pgfmathresult}
			\pgfmathparse{
				(-\midangle>180?"flush left":"flush right")
			} \edef\textalign{\pgfmathresult}
			\pgfmathsetmacro\labelshiftdir{1-2*(-\midangle<180)}

			% Draw the color segments. Somehow, the \midrow units got lost, so
			% we add 'pt' at the end. Not nice...
			\filldraw[draw=white,fill=\colour]
				(-\cumnum:\outerradius)
				arc (-\cumnum:-(\newcumnum):\outerradius)
				-- (-\newcumnum:\innerradius)
				arc (-\newcumnum:-(\cumnum):\innerradius)
				-- cycle;

			% Draw the data labels
			\draw [*-,thin,wheelchartlabelcolor] node [append after command={
				(\midangle:\midradius pt) --
				(\midangle:\outerradius + 1ex) --
				(\tikzlastnode)}] at (\midangle:\outerradius + 1ex) [
				xshift=\labelshiftdir*0.5cm,inner sep=1ex,
				outer sep=0pt,
				text width=\width,
				anchor=\textanchor,
				align=\textalign,
				font=\small,
				text=wheeltextcolor
			]{\name};
			% Set the old cumulated angle to the new value
			\global\let\cumnum=\newcumnum
		}
		\end{scope}
	\end{tikzpicture}\par
}

\newcommand{\cvsignature}{
	\vfill
	{\large\bfseries\color{maincolor!70}\today \hfill \cvname}
}


%-------------------------------------------------------------------------------
%                               SIDEBAR LAYOUT
%-------------------------------------------------------------------------------
% draw sidebar background on current page
\newcommand{\drawSidebarBG}{%
	\AddToShipoutPictureBG*{%
		\begin{tikzpicture}[remember picture, overlay]
			\node[
				rectangle,
				fill=sidecolor,
				anchor=north west,
				minimum width=\sidebarwidth,
				minimum height=\paperheight,
			]{};%
			% plot vertical red guideline
			\plotvline%
		\end{tikzpicture}%
	}%
}

% use textpos to position textblock within TikZ background; we have to use
% the starred version for absolute values here, b/c we use \pagewidth directly
% instead of \setlength{\TPHorizModule}{<dimen>}, which seems to be "absolute"
% as opposed to "relative" - strange but true.
\newenvironment{sidebar}{%
	\drawSidebarBG%
	\begin{textblock*}{\sidebartextwidth}(\leftrightmargin, \topbottommargin)
}{%
	\end{textblock*}%
}

% provide user interface for easily adding new sections in side bars
% default: empty sidebar
\newcommand{\frontsidebar}{}
\newcommand{\backsidebar}{}
\newcommand{\addtofrontsidebar}[1]{\apptocmd{\frontsidebar}{#1}{}{}}
\newcommand{\addtobacksidebar}[1]{\apptocmd{\backsidebar}{#1}{}{}}
\newcommand{\addtonbacksidebar}[1]{\apptocmd{\nbacksidebar}{#1}{}{}}
\newcommand{\makefrontsidebar}{%
	\begin{sidebar}
		% most sidebar commands end with \par; increase space between them
		\setlength{\parskip}{1ex}

		% optionally insert logo picture before profile
		\plotlogobefore

		% optionally insert profile picture
		\plotprofilepicture

		% optionally insert logo picture after profile
		\plotlogoafter

		\vspace{1ex}

		% name and job
		\nameandjob

		% personal information
		\vspace*{0.5em}
		\begin{icontable}[1.6]{1.7em}{0.4em}
			\personaldata
		\end{icontable}

		% user definitions
		\frontsidebar
	\end{sidebar}
}

\newcommand{\makebacksidebar}{%
	\begin{sidebar}
		% begin with name instead of picture
		\nameandjob

		% make sure there is no space at top, but after cvjob
		\setlength{\parskip}{1ex}
                
		% user definitions
		\backsidebar
	\end{sidebar}
}

\newcommand{\makenbacksidebar}{%
	\begin{sidebar}
		% begin with name instead of picture
		\nameandjob

		% make sure there is no space at top, but after cvjob
		\setlength{\parskip}{1ex}
                \plotlogobefore
		% user definitions
		\backsidebar
	\end{sidebar}
}

%-------------------------------------------------------------------------------
%                              LIST ENVIRONMENTS
%-------------------------------------------------------------------------------
% reduce space between table columns to minimum
\setlength{\tabcolsep}{0pt}

% cv list environment --> table, left aligned, width=textwidth
% tabular starred version adds space to make table as wide as \textwidth here
\newenvironment{cvtable}[1][1]{%
	\renewcommand{\arraystretch}{#1}%
	\begin{tabular*}{\textwidth}{@{\extracolsep{\fill}}ll}%
}{%
	\end{tabular*}%
}

% | <keyword>      <one-line description>            |
% use parbox if text needs to use multiple lines
\newcommand{\cvitemshort}[2]{%
	\parbox[t]{0.17\textwidth}{\raggedright #1}
	& \parbox[t]{0.81\textwidth}{#2} \\}

% | <date>         <bold-title>  \hfill  <location>  |
% |                <longer description>              |
% or, if description is empty:
% | <date>         <title>       \hfill  <location>  |
\newcommand{\cvitem}[4]{%
	\parbox[t]{0.17\textwidth}{\raggedright #1} &%
	\parbox[t]{0.81\textwidth}{%
		\if\relax\detokenize{#4}\relax%
			\parbox[t]{\linewidth-\widthof{\footnotesize #3}-1em}{\raggedright #2}%
			\hfill {\footnotesize#3}%
		\else%
			\parbox[t]{\linewidth-\widthof{\footnotesize #3}-1em}{%
				\raggedright \textbf{#2}%
			} \hfill {\footnotesize#3} \\%
			\textcolor{itemtextcolor}{#4}%\vspace{\parsep}%
		\fi%
	}\\
}

% publication item
% \cvpubitem{<title>}{<author>}{<journal>}{<year>} will produce
% | <year>         <bold title>                      |
% |                <italic author>                   |
% |                <journal>                         |
\newcommand{\cvpubitem}[4]{%
	\parbox[t]{0.17\textwidth}{\raggedright #4} &
	\parbox[t]{0.81\textwidth}{%
		\textbf{#1} \par \textit{#2} \par #3 \vspace{\parsep}%
	}\\
}

% EOF - sixtysecondscv.cls
