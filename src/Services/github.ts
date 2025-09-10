import { graphql } from '@octokit/graphql'
import JSZip from 'jszip'
import type { TreeEntry } from '@/Models/TreeEntry'

const owner = import.meta.env.VITE_GH_OWNER
const repo  = import.meta.env.VITE_GH_REPO
const ref   = import.meta.env.VITE_GH_REF
const token = import.meta.env.VITE_GH_TOKEN

export const listFilesInDir = async (dir: string): Promise<string[]> => {
  const gh = graphql.defaults({
    headers: { authorization: `token ${token}` }
  })
  const expr = `${ref}:${dir.replace(/^\/+/, '').replace(/\/+$/, '')}`
  const query = `query($owner:String!, $repo:String!, $expr:String!){
    repository(owner:$owner, name:$repo){
      object(expression:$expr){
        ... on Tree {
          entries { name type }
        }
      }
    }
  }`
  const res: any = await gh(query, { owner, repo, expr })
  const entries = res.repository?.object?.entries ?? []
  const base = dir.replace(/\/+$/, '')
  return entries.map((e: any) => base ? `${base}/${e.name}` : e.name)
}

export const downloadRepoDirAsZip = async (dir: string) => {
  const baseDir = dir.replace(/^\/+/, '').replace(/\/+$/, '')
  const headers: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {}

  // 1) refのコミット→treeのSHAを取得
  const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${encodeURIComponent(ref)}`, { headers })
  if (!commitRes.ok) throw new Error(`failed to resolve ref: ${ref}`)
  const commitJson = await commitRes.json()
  const treeSha: string | undefined = commitJson?.commit?.tree?.sha
  if (!treeSha) throw new Error('tree sha not found')

  // 2) ツリーを再帰取得
  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`, { headers })
  if (!treeRes.ok) throw new Error('failed to fetch tree')
  const treeJson = await treeRes.json()
  const tree = (treeJson.tree ?? []) as TreeEntry[]
  const all = tree.filter(e =>
    e.type === 'blob' && (e.path === baseDir || e.path.startsWith(baseDir + '/'))
  )

  if (all.length === 0) throw new Error('no files found under the directory')

  // 3) 各BlobをRAWで取得 → ZIPへ投入（並列）
  const zip = new JSZip()
  const blobHeaders = { ...headers, accept: 'application/vnd.github.raw' }

  const files = await Promise.all(all.map(async e => {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${e.sha}`, { headers: blobHeaders })
    if (!r.ok) throw new Error(`failed to fetch blob: ${e.path}`)
    const buf = await r.arrayBuffer()
    const rel = e.path === baseDir ? e.path.split('/').pop() || 'file' : e.path.slice(baseDir.length + 1)
    return { rel, buf }
  }))

  files.forEach(f => zip.file(f.rel, f.buf))

  // 4 Change Log 生成
  let logs: string = await getChangeLog(dir)
  zip.file('CHANGELOG.txt', logs)

  // 5) ZIP生成→ダウンロード
  const blob = await zip.generateAsync({ type: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  const zipName = (baseDir.split('/').pop() || 'download') + '.zip'
  a.download = zipName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
}

export type CommitNode = {
  oid: string
  messageHeadline: string
  committedDate: string
  authoredDate: string
  url: string
  author: { name: string | null, email: string | null, user: { login: string } | null } | null
  committer: { name: string | null, email: string | null, user: { login: string } | null } | null
}

/**
 * 指定ディレクトリ配下に影響したコミット履歴を全件取得して NDJSON 文字列で返す（ブラウザ用）
 * @param path 収集対象のディレクトリ（例: "DCSWorld/Mods/aircraft/A-10C"）
 * @param parPage 収集ページ数 (1～100)
 * @returns string
*/
export const getChangeLog = async ( path: string, perPage: number = 100): Promise<string> => {
  perPage = Math.min(Math.max(perPage ?? 100, 1), 100)
  const toQualifiedName = (ref: string) => ref.startsWith('refs/') ? ref : `refs/heads/${ref}`
  const qualifiedName = toQualifiedName(ref)
  const gql = graphql.defaults({ headers: { authorization: `bearer ${String(token).trim()}` } })

  const query = `
    query CommitsByPath(
      $owner: String!, $repo: String!,
      $qualifiedName: String!, $path: String!,
      $pageSize: Int = 100, $after: String
    ) {
      repository(owner: $owner, name: $repo) {
        ref(qualifiedName: $qualifiedName) {
          target {
            ... on Commit {
              history(first: $pageSize, after: $after, path: $path) {
                pageInfo { hasNextPage endCursor }
                nodes {
                  oid
                  messageHeadline
                  committedDate
                  authoredDate
                  url
                  author { name email user { login } }
                  committer { name email user { login } }
                }
              }
            }
          }
        }
      }
      rateLimit { remaining resetAt }
    }
  `
  let after: string | null = null
  let text: string = 'CHANGELOG\n=========\n\n'

  while (true) {
    const res: {repository: any, rateLimit: any} =
      await gql<{ repository: any, rateLimit: any }>(query, {owner, repo, qualifiedName, path, pageSize: perPage, after})

    const history = res.repository?.ref?.target?.history
    if (!history) break

    const nodes: CommitNode[] = history.nodes ?? []
    if (nodes.length) {
      nodes.forEach(n => {
        text += `${n.committedDate}\nmessage:\n${n.messageHeadline}\n${n.url}\n\n`
      })
    }

    if (!history.pageInfo?.hasNextPage) break
    after = history.pageInfo.endCursor
  }
  return text
}
