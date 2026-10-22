import { useMemo, useState, type ReactNode } from 'react';
import {
	ACCESS_CONTROLS,
	ACTIVITY,
	BASES,
	DATA_ITEMS,
	DEFAULT_INPUT,
	DISCLAIMER,
	DISCLOSURE,
	EXTERNAL_API,
	LLM_USE,
	RETENTION,
	evaluate,
	toMarkdown,
	type Finding,
	type SelfCheckInput,
} from '../lib/selfcheck/rules';
import './self-check.css';

// 입력값은 React state에만 존재한다. 네트워크 전송, localStorage, URL 쿼리에 저장하지 않는다.

interface Props {
	base: string;
	docTitles: Record<string, string>;
}

type Opts = Record<string, string>;

function Radio<K extends keyof SelfCheckInput>({ name, label, opts, value, set }: { name: K; label: string; opts: Opts; value: string; set: (k: K, v: SelfCheckInput[K]) => void }) {
	return (
		<fieldset className="sc-field">
			<legend>{label}</legend>
			{Object.entries(opts).map(([k, text]) => (
				<label key={k} className="sc-option">
					<input type="radio" name={name} value={k} checked={value === k} onChange={() => set(name, k as SelfCheckInput[K])} />
					<span>{text}</span>
				</label>
			))}
		</fieldset>
	);
}

function Multi<K extends 'items' | 'bases' | 'access'>({ name, label, hint, opts, value, set }: { name: K; label: string; hint?: string; opts: Opts; value: string[]; set: (k: K, v: SelfCheckInput[K]) => void }) {
	const toggle = (k: string) => set(name, (value.includes(k) ? value.filter((v) => v !== k) : [...value, k]) as SelfCheckInput[K]);
	return (
		<fieldset className="sc-field">
			<legend>{label}</legend>
			{hint && <p className="sc-hint">{hint}</p>}
			{Object.entries(opts).map(([k, text]) => (
				<label key={k} className="sc-option">
					<input type="checkbox" checked={value.includes(k)} onChange={() => toggle(k)} />
					<span>{text}</span>
				</label>
			))}
		</fieldset>
	);
}

function Section({ title, tone, items, docUrl, docTitles }: { title: string; tone: string; items: Finding[]; docUrl: (s: string) => string; docTitles: Record<string, string> }) {
	if (items.length === 0) return null;
	return (
		<section className={`sc-result sc-${tone}`}>
			<h3>
				{title} <span className="sc-count">{items.length}</span>
			</h3>
			<ul>
				{items.map((f) => (
					<li key={f.id}>
						<p>{f.text}</p>
						<p className="sc-meta">
							{f.basis && <span>근거: {f.basis}</span>}
							{f.doc && (
								<a href={docUrl(f.doc)}>{docTitles[f.doc] ?? f.doc} →</a>
							)}
						</p>
					</li>
				))}
			</ul>
		</section>
	);
}

export default function SelfCheck({ base, docTitles }: Props) {
	const [input, setInput] = useState<SelfCheckInput>(DEFAULT_INPUT);
	const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
	const set = <K extends keyof SelfCheckInput>(k: K, v: SelfCheckInput[K]) => {
		setInput((prev) => ({ ...prev, [k]: v }));
		setCopied('idle');
	};
	const result = useMemo(() => evaluate(input), [input]);
	const prefix = base.replace(/\/$/, '');
	const docUrl = (slug: string) => `${prefix}/${slug}/`;
	const absUrl = (slug: string) => (typeof window === 'undefined' ? docUrl(slug) : new URL(docUrl(slug), window.location.origin).href);

	const copy = async () => {
		const md = toMarkdown(input, result, absUrl);
		try {
			await navigator.clipboard.writeText(md);
			setCopied('ok');
		} catch {
			setCopied('fail');
		}
	};

	const skip = input.collects === 'no' && !input.employeeData;
	const group = (title: string, children: ReactNode) => (
		<div className="sc-group">
			<h3>{title}</h3>
			{children}
		</div>
	);

	return (
		<div className="sc-root not-content">
			<form className="sc-form" onSubmit={(e) => e.preventDefault()} aria-label="자가진단 입력">
				{group(
					'서비스와 수집',
					<>
						<Radio name="service" label="서비스 유형" opts={{ external: '외부 서비스 (고객·이용자 대상)', internal: '사내 서비스 (직원 대상)' }} value={input.service} set={set} />
						<Radio name="collects" label="개인정보를 수집·이용하나요?" opts={{ yes: '예', no: '아니요', unsure: '잘 모르겠음' }} value={input.collects} set={set} />
						<label className="sc-option sc-standalone">
							<input type="checkbox" checked={input.employeeData} onChange={(e) => set('employeeData', e.target.checked)} />
							<span>직원(임직원·협력사 인력) 데이터가 포함됨</span>
						</label>
					</>,
				)}
				{!skip && (
					<>
						{group(
							'항목과 근거',
							<>
								<Multi name="items" label="수집 항목" opts={DATA_ITEMS} value={input.items} set={set} />
								<Multi name="bases" label="법적 처리 근거" hint="항목마다 다를 수 있습니다. 해당하는 것을 모두 고르세요." opts={BASES} value={input.bases} set={set} />
							</>,
						)}
						{group(
							'권한과 공개',
							<>
								<Radio name="activity" label="개인별 활동 분석" opts={ACTIVITY} value={input.activity} set={set} />
								<Multi name="access" label="갖춘 접근권한 통제" opts={ACCESS_CONTROLS} value={input.access} set={set} />
								<Radio name="disclosure" label="데이터 공개 범위 (가장 넓은 범위)" opts={DISCLOSURE} value={input.disclosure} set={set} />
							</>,
						)}
						{group(
							'외부 전송과 보존',
							<>
								<Radio name="externalApi" label="외부 API·업체로 개인정보 전송" opts={EXTERNAL_API} value={input.externalApi} set={set} />
								<label className="sc-option sc-standalone">
									<input type="checkbox" checked={input.overseas} onChange={(e) => set('overseas', e.target.checked)} />
									<span>국외 서버·리전·해외 업체로 이전됨</span>
								</label>
								<Radio name="llm" label="외부 LLM 활용" opts={LLM_USE} value={input.llm} set={set} />
								<Radio name="retention" label="보존·파기 정책" opts={RETENTION} value={input.retention} set={set} />
							</>,
						)}
					</>
				)}
				<button type="button" className="sc-reset" onClick={() => setInput(DEFAULT_INPUT)}>
					입력 초기화
				</button>
			</form>

			<div className="sc-output" aria-live="polite">
				<p className="sc-disclaimer">{DISCLAIMER}</p>
				<Section title="위험하거나 누락된 항목" tone="risk" items={result.risks} docUrl={docUrl} docTitles={docTitles} />
				<Section title="확인해야 할 법률 요건" tone="req" items={result.requirements} docUrl={docUrl} docTitles={docTitles} />
				<Section title="확인이 필요한 예외사항" tone="exc" items={result.exceptions} docUrl={docUrl} docTitles={docTitles} />
				<Section title="설계 시 권장 사항" tone="rec" items={result.recommendations} docUrl={docUrl} docTitles={docTitles} />
				{result.docs.length > 0 && (
					<section className="sc-result">
						<h3>관련 가이드</h3>
						<ul className="sc-docs">
							{result.docs.map((d) => (
								<li key={d}>
									<a href={docUrl(d)}>{docTitles[d] ?? d}</a>
								</li>
							))}
						</ul>
					</section>
				)}
				<div className="sc-actions">
					<button type="button" onClick={copy}>
						개발 체크리스트 Markdown 복사
					</button>
					<span role="status">{copied === 'ok' ? '복사했습니다.' : copied === 'fail' ? '복사에 실패했습니다. 브라우저 권한을 확인하세요.' : ''}</span>
				</div>
			</div>
		</div>
	);
}
