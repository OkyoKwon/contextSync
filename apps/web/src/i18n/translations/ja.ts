import type { TranslationKeys } from '../types';

export const ja: TranslationKeys = {
  // App
  'app.loading': '読み込み中...',

  // Nav
  'nav.login': 'ログイン',

  // Hero
  'hero.title': 'AIセッションコンテキストの中心',
  'hero.subtitle': 'Claude Codeセッションを管理 — ソロでもチームでも',
  'hero.cta.login': '始める',
  'hero.cta.features': '機能を見る',

  // Problem Statement
  'problem.sectionLabel': '// Why ContextSync',
  'problem.solo.label': 'Solo Developer',
  'problem.solo.prompt1': 'claude "先週の決済モジュールの続きをやって"',
  'problem.solo.output1': '→ セッションコンテキストが見つかりません... 最初から開始',
  'problem.solo.output2': '→ どのファイルを修正した？アプローチは？',
  'problem.solo.prompt2': 'contextsync restore --last "payment module"',
  'problem.solo.output3': '✓ セッション復元完了 — 47メッセージ、12ファイル、フルコンテキストロード',
  'problem.team.label': 'Team Collaboration',
  'problem.team.prompt1': 'claude "authモジュールをリファクタリングして"',
  'problem.team.output1': '→ src/auth/middleware.ts を変更中...',
  'problem.team.output2': '→ src/auth/session.ts を変更中...',
  'problem.team.prompt2': 'claude "セッション管理ロジックを改善して"',
  'problem.team.output3': '→ src/auth/session.ts を変更中...',
  'problem.team.output4': '→ src/auth/token.ts を変更中...',
  'problem.team.conflict': '⚠ CONFLICT: src/auth/session.ts — 2人が同時作業中',
  'problem.team.resolved': '✓ コンフリクト事前検知完了 — dev-A, dev-Bに通知送信',
  'problem.conclusion': 'ソロのコンテキスト復元からチームのコンフリクト防止まで、',
  'problem.conclusionHighlight': 'ContextSyncがすべてのセッションをつなぎます',
  'problem.conclusionEnd': '',

  // Features
  'features.sectionLabel': '// Features',
  'features.hero.0.title': 'Session Archive & Sync',
  'features.hero.0.description': 'セッションをチームのナレッジ資産に',
  'features.hero.0.detail.0': 'Claude Code（CLI）セッションの自動収集・アーカイブ',
  'features.hero.0.detail.1': 'プロジェクト別セッショングルーピング・タイムライン',
  'features.hero.0.detail.2': 'メッセージ単位の全文検索（Full-text search）',
  'features.hero.0.detail.3': 'トークン使用量・コスト分析ダッシュボード',
  'features.hero.1.title': 'Conflict Detection',
  'features.hero.1.description': 'マージ前にコンフリクトを検知',
  'features.hero.1.detail.0': '同じファイルを同時編集中のメンバーをリアルタイム検知',
  'features.hero.1.detail.1': 'コンフリクト重大度の自動分類（Critical / High / Medium / Low）',
  'features.hero.1.detail.2': 'ファイル別・モジュール別コンフリクトヒートマップ',
  'features.hero.1.detail.3': 'メンバーへの即時通知送信',
  'features.hero.2.title': 'PRD Analysis',
  'features.hero.2.description': 'AIが分析する要件達成率',
  'features.hero.2.detail.0': 'PRDドキュメントアップロード・要件自動抽出',
  'features.hero.2.detail.1': 'セッション会話ベースの達成率自動計算',
  'features.hero.2.detail.2': '要件別の詳細ステータス追跡',
  'features.hero.2.detail.3': '変化率トレンドチャート・レポート',

  // How It Works
  'howItWorks.sectionLabel': '// How It Works',
  'howItWorks.step.0.title': 'Import',
  'howItWorks.step.0.description':
    'ローカルClaude Code（CLI）セッションをプロジェクトに同期、または他のAIツールのセッションファイルをインポート。',
  'howItWorks.step.1.title': 'Analyze',
  'howItWorks.step.1.description':
    'コンフリクト検知、PRD達成率分析、トークン使用量追跡を自動実行。',
  'howItWorks.step.2.title': 'Scale',
  'howItWorks.step.2.description':
    'ソロで始めて、準備ができたらチームを招待。ロールベースアクセス制御とコンフリクト検知を内蔵。',

  // Social Proof
  'social.sectionLabel': '// Platform Overview',
  'social.stat.0.label': 'APIモジュール',
  'social.stat.1.label': 'デプロイモード',
  'social.stat.2.label': '重大度レベル',
  'social.stat.3.label': '主要機能',
  'social.testimonial.0.quote':
    '「Claude Codeセッションが消えるのが一番怖かったのですが、今はチーム全体の履歴が検索可能になりました。」',
  'social.testimonial.0.author': '— フロントエンドリード、スタートアップA',
  'social.testimonial.1.quote':
    '「同じファイルの同時作業でマージ地獄に陥ることが大幅に減りました。コンフリクト検知が核心機能です。」',
  'social.testimonial.1.author': '— CTO、スタートアップB',

  // Docs
  'docs.hero.title': 'ContextSyncの活用方法を学ぼう',
  'docs.hero.subtitle': 'チームのClaude Codeセッションをアーカイブ・同期・検索・コンフリクト検知',
  'docs.hero.highlight.0.title': 'Session Sync',
  'docs.hero.highlight.0.desc': 'Claude Code（CLI）セッションを自動でインポート・アーカイブ',
  'docs.hero.highlight.1.title': 'Conflict Detection',
  'docs.hero.highlight.1.desc': 'マージ地獄になる前にファイルコンフリクトを検知',
  'docs.hero.highlight.2.title': 'Full-Text Search',
  'docs.hero.highlight.2.desc': 'すべてのセッション、メッセージ、コード変更を横断検索',
  'docs.hero.cta': '始める',
  'docs.toc.title': '目次',
  'docs.toc.gettingStarted': 'はじめに',
  'docs.toc.features': '機能',
  'docs.toc.faq': 'FAQ',
  'docs.gettingStarted.title': 'はじめに',
  'docs.gettingStarted.step.0.title': 'プロジェクトを作成',
  'docs.gettingStarted.step.0.desc':
    '名前を入力してローカル作業ディレクトリをリンクします。プロジェクトはすべてのセッション、コンフリクト、分析を一か所にグループ化します。',
  'docs.gettingStarted.step.1.title': '最初のセッションを同期',
  'docs.gettingStarted.step.1.desc':
    'ローカルClaude Codeセッションをスキャンしてインポートします。.claude/ディレクトリから会話、ファイル変更、トークン使用量を読み取りアップロードします。',
  'docs.gettingStarted.step.2.title': 'ダッシュボードを探索',
  'docs.gettingStarted.step.2.desc':
    'セッション統計、タイムライン、トークン使用量チャート、ホットファイルを確認できます。ダッシュボードでチームのAI活動をリアルタイムに把握しましょう。',
  'docs.gettingStarted.step.3.title': 'チームを招待',
  'docs.gettingStarted.step.3.desc':
    'OwnerまたはMemberのロールでコラボレーターを追加します。各ロールにはプロジェクトとセッション管理の異なる権限があります。',
  'docs.features.title': '機能',
  'docs.features.learnMore': '詳しく見る',
  'docs.features.0.title': 'Session Sync',
  'docs.features.0.summary':
    'ローカル.claude/ディレクトリからClaude Code（CLI）セッションをスキャン。他のAIツールは手動ファイルインポートにも対応。',
  'docs.features.0.detail':
    'セッション同期はローカルClaude Code（CLI）セッションファイルを読み取り、会話とファイル変更を抽出してプロジェクトにアップロードします。手動スキャンまたは自動検知が使えます。他のツール（claude.aiウェブ、Cursor、Windsurf等）はImportボタンでセッションファイルを直接アップロードできます。各同期はステータス（待機中、同期中、完了、失敗）を表示します。',
  'docs.features.1.title': 'Conflict Detection',
  'docs.features.1.summary':
    '複数のチームメンバーが同じファイルを編集すると自動検知。重大度バッジ（info、warning、critical）とステータスフロー追跡。',
  'docs.features.1.detail':
    '2人以上のメンバーが重複するセッションで同じファイルを変更すると、潜在的コンフリクトをフラグ付けします。重大度別に自動分類され — infoは低リスク、warningは中程度の重複、criticalは同じコードブロックの直接編集です。構造化されたワークフロー（検知→レビュー→解決）でコンフリクトを管理します。',
  'docs.features.2.title': 'Dashboard',
  'docs.features.2.summary':
    '今日・週間セッション数、アクティブコンフリクト、トークン使用量チャート、ホットファイルリストを一覧。',
  'docs.features.2.detail':
    'ダッシュボードはチームのコマンドセンターです。今日のセッション数、週間トレンド、アクティブコンフリクトアラート、モデル別トークン使用量、最も頻繁に変更される「ホットファイル」リストを表示します。',
  'docs.features.3.title': 'PRD Analysis',
  'docs.features.3.summary':
    'PRDドキュメントをアップロードし、Claudeがセッション全体の要件達成率を分析。',
  'docs.features.3.detail':
    'PRDをアップロードするとClaude APIで分析を送信します。個別要件を抽出し、セッションが各要件をどれだけ満たしているか追跡します。要件ごとの達成率と全体スコアを提供します。',
  'docs.features.4.title': 'Plans',
  'docs.features.4.summary': 'プロジェクト連携可能なMarkdownプランを作成・閲覧。',
  'docs.features.4.detail':
    'プランは実装戦略、アーキテクチャ決定、タスク分類を記述するMarkdownドキュメントです。各プランはプロジェクトに関連付けられ、セッションの計画コンテキストを簡単に見つけられます。',
  'docs.features.5.title': 'Search',
  'docs.features.5.summary':
    'すべてのセッションとメッセージの全文検索。会話やコード変更を即座に検索。',
  'docs.features.5.detail':
    'PostgreSQL全文検索をtsvectorインデックスで使用。キーワード、ファイルパス、コードスニペットでセッション履歴全体を検索できます。結果は関連度順にソートされセッション別にグループ化されます。',
  'docs.features.6.title': 'Team Collaboration',
  'docs.features.6.summary':
    'OwnerとMemberのロールベースアクセス制御。コラボレーターを招待し権限を管理。',
  'docs.features.6.detail':
    'プロジェクトは2つのロールに対応：Owner（削除およびメンバー管理を含む全権限）とMember（セッション閲覧と同期）。名前でメンバーを招待し設定でロールを管理できます。',
  'docs.features.7.title': 'AI Evaluation',
  'docs.features.7.summary':
    'チームメンバーのAI活用度をセッション単位で分析し、多次元評価でスコア化。',
  'docs.features.7.detail':
    'AI評価は各メンバーのClaude Codeセッションを分析し、コード品質、会話の深さ、ツール使用パターン、タスク完了率など複数の次元で活用度スコアを算出します。各スコアには詳細な根拠と推論が含まれ、チームがAI支援をどれだけ効果的に活用しているか把握し改善領域を特定するのに役立ちます。',
  'docs.faq.title': 'よくある質問',
  'docs.faq.0.q': 'セッション同期はどのデータを収集しますか？',
  'docs.faq.0.a':
    'ローカル.claude/ディレクトリから会話メッセージ、ファイル変更メタデータ（パスと変更タイプ）、トークン使用量、セッションタイムスタンプを収集します。実際のソースコードはアップロードしません。',
  'docs.faq.1.q': '検知されたコンフリクトをどう解決しますか？',
  'docs.faq.1.a':
    'Conflictsページでコンフリクトをクリックして詳細を確認し、「Start Review」をクリックしてレビュー状態に移行します。チームメンバーと調整後、「Resolve」をクリックして解決済みにします。',
  'docs.faq.2.q': 'PRD分析にAnthropic APIキーは必要ですか？',
  'docs.faq.2.a':
    'はい。PRD分析はClaude APIを使用します。サーバーにANTHROPIC_API_KEY環境変数を設定してください。なければPRD分析機能は利用できません。',
  'docs.faq.3.q': 'チームロールの違いは何ですか？',
  'docs.faq.3.a':
    'Owner：削除、ロール管理、メンバー管理を含む全プロジェクト制御。Member：データ閲覧と自身のセッション同期。両ロールで検索とセッション閲覧が可能です。',
  'docs.faq.4.q': '何を検索できますか？',
  'docs.faq.4.a':
    'セッションタイトル、会話メッセージ、ファイルパスを検索できます。PostgreSQL全文検索インデックスを使用しており、自然言語クエリと部分マッチングに対応しています。',
  'docs.faq.5.q': 'ローカルセッションはどこに保存されますか？',
  'docs.faq.5.a':
    'Claude Code（CLI）はプロジェクトルートの.claude/ディレクトリにセッションデータを保存します。セッションスキャンをトリガーするとこのディレクトリから読み取ります。他のAIツール（claude.aiウェブ、Cursor、Windsurf等）のセッションはImportボタンで手動アップロードできます。',

  // App Entry
  'app.connectionError': 'サーバーに接続できません',
  'app.retry': '再試行',

  // Login
  'login.backToHome': '\u2190 ホームへ',

  // Nav (additional)
  'nav.docs': 'ドキュメント',
  'nav.github': 'GitHub',

  // Hero (additional)
  'hero.cta.viewOnGithub': 'View on GitHub',

  // Quick Start
  'quickstart.sectionLabel': '// Quick Start',
  'quickstart.title': '3つのコマンドで始める',
  'quickstart.prerequisites': '前提条件: Node.js 22 \u00b7 pnpm 9+ \u00b7 Docker',
  'quickstart.copied': 'コピーしました！',

  // Screenshot Alt
  'screenshot.alt.dashboard': 'ContextSyncダッシュボード概要',
  'screenshot.alt.sessionConversation': 'セッション会話ビュー',
  'screenshot.alt.conflictsList': 'コンフリクト検知リスト',
  'screenshot.alt.prdAnalysis': 'PRD分析結果',
  'screenshot.alt.searchOverlay': '全文検索オーバーレイ',
  'screenshot.alt.settingsTeam': 'チーム設定・メンバー管理',
  'screenshot.alt.aiEvaluation': 'AI評価スコア',
  'screenshot.alt.plansView': 'プロジェクトにリンクされたマークダウン計画ドキュメントビュー',

  // Open Source
  'openSource.sectionLabel': '// Open Source',
  'openSource.title': 'MITライセンス & コミュニティ主導',
  'openSource.subtitle': 'オープンに開発。Fork、拡張、あなた自身のものにしてください。',
  'openSource.license.title': 'MIT License',
  'openSource.license.description':
    '自由に使用、変更、配布できます。ベンダーロックインなし、制約なし。',
  'openSource.community.title': 'コミュニティファースト',
  'openSource.community.description':
    '開発者が開発者のために構築。すべての機能は実際の使用経験から生まれます。',
  'openSource.contributors.title': 'オープンコントリビューション',
  'openSource.contributors.description':
    'PRを歓迎します。コントリビューションガイドを確認して数分で始められます。',
  'openSource.cta.star': 'Star on GitHub',
  'openSource.cta.contributing': 'コントリビューションガイド',
  'openSource.cta.issues': 'Issueを報告',

  // Hero (additional CTA)
  'hero.cta.getStarted': '始める',

  // Footer
  'footer.cta.title': 'AIワークフローを同期しよう',
  'footer.cta.subtitle': '無料で始めましょう。Dockerでローカル実行、またはチームDBに接続。',
  'footer.cta.button': '始める',
  'footer.link.docs': 'Docs',
  'footer.link.github': 'GitHub',
  'footer.link.contact': 'Contact',
  'footer.link.contributing': 'Contributing',
  'footer.link.license': 'MIT License',
};
