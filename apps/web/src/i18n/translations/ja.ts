import type { TranslationKeys } from '../types';

export const ja: TranslationKeys = {
  // Nav
  'nav.login': 'GitHub Login',

  // Hero
  'hero.title': 'AIセッションコンテキストの中心',
  'hero.subtitle': 'チームのClaude Codeセッションをアーカイブ・同期・検索・コンフリクト検知',
  'hero.cta.github': 'Continue with GitHub',
  'hero.cta.features': '機能を見る',

  // Problem Statement
  'problem.sectionLabel': '// Why ContextSync',
  'problem.terminal.prompt1': 'claude "authモジュールをリファクタリングして"',
  'problem.terminal.output1': '→ src/auth/middleware.ts を変更中...',
  'problem.terminal.output2': '→ src/auth/session.ts を変更中...',
  'problem.terminal.prompt2': 'claude "セッション管理ロジックを改善して"',
  'problem.terminal.output3': '→ src/auth/session.ts を変更中...',
  'problem.terminal.output4': '→ src/auth/token.ts を変更中...',
  'problem.terminal.conflict': '⚠ CONFLICT: src/auth/session.ts — 2人が同時作業中',
  'problem.terminal.resolved': '✓ コンフリクト事前検知完了 — dev-A, dev-Bに通知送信',
  'problem.conclusion': 'チームがAIと働くとき、',
  'problem.conclusionHighlight': 'コンテキスト同期は必須',
  'problem.conclusionEnd': 'です',

  // Features
  'features.sectionLabel': '// Features',
  'features.hero.0.title': 'Session Archive & Sync',
  'features.hero.0.description': 'セッションをチームのナレッジ資産に',
  'features.hero.0.detail.0': 'Claude Codeセッションの自動収集・アーカイブ',
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
  'features.sub.0.title': 'Dashboard & Analytics',
  'features.sub.0.description': 'チーム全体のAI作業状況をリアルタイムタイムラインと統計で一目把握',
  'features.sub.1.title': 'Full-text Search',
  'features.sub.1.description':
    '数千のセッションから必要な会話を即座に検索。メッセージ・ファイル・コード単位フィルタリング',
  'features.sub.2.title': 'Team Collaboration',
  'features.sub.2.description':
    'ロールベースアクセス制御（Owner / Admin / Member）。メンバー招待・プロジェクト共有',
  'features.sub.3.title': 'Local Session Sync',
  'features.sub.3.description':
    'ローカルClaude Codeセッションをワンクリックでチームに共有。自動プロジェクトマッチング',

  // How It Works
  'howItWorks.sectionLabel': '// How It Works',
  'howItWorks.step.0.title': 'Import',
  'howItWorks.step.0.description':
    'ローカルClaude Codeセッションをプロジェクトに同期。自動マッチングでワンクリックアップロード。',
  'howItWorks.step.1.title': 'Analyze',
  'howItWorks.step.1.description':
    'コンフリクト検知、PRD達成率分析、トークン使用量追跡を自動実行。',
  'howItWorks.step.2.title': 'Collaborate',
  'howItWorks.step.2.description':
    'メンバーとセッションを共有し、コンフリクトを事前防止し、ナレッジを蓄積。',

  // Social Proof
  'social.sectionLabel': '// By the Numbers',
  'social.stat.0.label': 'チーム',
  'social.stat.1.label': 'セッションアーカイブ',
  'social.stat.2.label': 'コンフリクト事前防止',
  'social.stat.3.label': '平均達成率',
  'social.testimonial.0.quote':
    '「Claude Codeセッションが消えるのが一番怖かったのですが、今はチーム全体の履歴が検索可能になりました。」',
  'social.testimonial.0.author': '— フロントエンドリード、スタートアップA',
  'social.testimonial.1.quote':
    '「同じファイルの同時作業でマージ地獄に陥ることが大幅に減りました。コンフリクト検知が核心機能です。」',
  'social.testimonial.1.author': '— CTO、スタートアップB',

  // Terminal Demo
  'demo.sectionLabel': '// Terminal Demo',
  'demo.scanning': '⠋ ローカルセッションスキャン中...',
  'demo.found': '✓ 新規セッション3件発見',
  'demo.uploaded': '✓ アップロード完了 — 1,247メッセージ、34ファイル変更',
  'demo.conflict1': '⚠ src/auth/session.ts — dev-A, dev-B 同時作業中',
  'demo.conflict2': '⚠ src/api/routes.ts — dev-A, dev-C 同時作業中',
  'demo.notified': '→ 関連メンバーに通知を送信しました。',

  // Footer
  'footer.cta.title': 'チームのAIワークフローを同期しよう',
  'footer.cta.subtitle':
    '無料で始めましょう。インストール不要、GitHubアカウントだけですぐ使えます。',
  'footer.cta.button': 'Continue with GitHub',
  'footer.link.docs': 'Docs',
  'footer.link.github': 'GitHub',
  'footer.link.contact': 'Contact',
};
